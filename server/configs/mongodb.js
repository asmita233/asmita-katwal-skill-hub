import mongoose from 'mongoose';
import { resolveSrv } from 'dns/promises';

const buildSeedListUriFromSrv = async (mongoSrvUri) => {
    const parsed = new URL(mongoSrvUri);

    if (parsed.protocol !== 'mongodb+srv:') {
        return null;
    }

    const srvHost = parsed.hostname;
    const srvRecords = await resolveSrv(`_mongodb._tcp.${srvHost}`);

    if (!srvRecords || srvRecords.length === 0) {
        throw new Error(`No SRV records found for ${srvHost}`);
    }

    const hosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');
    const username = parsed.username ? encodeURIComponent(decodeURIComponent(parsed.username)) : '';
    const password = parsed.password ? encodeURIComponent(decodeURIComponent(parsed.password)) : '';
    const authPart = username ? `${username}:${password}@` : '';

    const params = new URLSearchParams(parsed.search);
    if (!params.has('tls') && !params.has('ssl')) params.set('tls', 'true');
    if (!params.has('retryWrites')) params.set('retryWrites', 'true');
    if (!params.has('w')) params.set('w', 'majority');
    if (username && !params.has('authSource')) params.set('authSource', 'admin');

    const dbPath = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/';
    const query = params.toString() ? `?${params.toString()}` : '';

    return `mongodb://${authPart}${hosts}${dbPath}${query}`;
};

const buildAtlasGuessUri = (mongoSrvUri) => {
    const parsed = new URL(mongoSrvUri);
    if (parsed.protocol !== 'mongodb+srv:') return null;

    const labels = parsed.hostname.split('.');
    if (labels.length < 3 || !parsed.hostname.endsWith('.mongodb.net')) return null;

    const clusterName = labels[0];
    const restDomain = labels.slice(1).join('.');

    const hosts = [
        `${clusterName}-shard-00-00.${restDomain}:27017`,
        `${clusterName}-shard-00-01.${restDomain}:27017`,
        `${clusterName}-shard-00-02.${restDomain}:27017`,
    ].join(',');

    const username = parsed.username ? encodeURIComponent(decodeURIComponent(parsed.username)) : '';
    const password = parsed.password ? encodeURIComponent(decodeURIComponent(parsed.password)) : '';
    const authPart = username ? `${username}:${password}@` : '';

    const params = new URLSearchParams(parsed.search);
    if (!params.has('replicaSet')) params.set('replicaSet', `atlas-${clusterName}-shard-0`);
    if (!params.has('tls') && !params.has('ssl')) params.set('tls', 'true');
    if (!params.has('authSource') && username) params.set('authSource', 'admin');
    if (!params.has('retryWrites')) params.set('retryWrites', 'true');
    if (!params.has('w')) params.set('w', 'majority');

    const dbPath = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/';
    const query = params.toString() ? `?${params.toString()}` : '';

    return `mongodb://${authPart}${hosts}${dbPath}${query}`;
};

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log(' MongoDB Connected Successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error(' MongoDB Connection Error:', err);
        });

        const mongoUri = process.env.MONGODB_URI;
        const directFallbackUri = process.env.MONGODB_URI_FALLBACK;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not set in environment variables');
        }

        try {
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 12000 });
        } catch (error) {
            const message = String(error.message || '');
            const isSrvLookupIssue =
                message.includes('queryTxt ETIMEOUT') ||
                message.includes('querySrv ECONNREFUSED') ||
                message.includes('querySrv ETIMEOUT') ||
                message.includes('querySrv ENOTFOUND');

            const canTrySrvFallback = mongoUri.startsWith('mongodb+srv://') && isSrvLookupIssue;

            if (!canTrySrvFallback) throw error;

            if (directFallbackUri) {
                console.warn(' MongoDB SRV lookup failed, trying MONGODB_URI_FALLBACK...');
                await mongoose.connect(directFallbackUri, { serverSelectionTimeoutMS: 12000 });
            } else {
                try {
                    console.warn(' MongoDB SRV lookup failed, trying seed-list fallback...');
                    const fallbackUri = await buildSeedListUriFromSrv(mongoUri);
                    await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 12000 });
                } catch (srvFallbackError) {
                    console.warn(' SRV seed-list fallback failed, trying Atlas host-guess fallback...');
                    const atlasGuessUri = buildAtlasGuessUri(mongoUri);
                    if (!atlasGuessUri) throw srvFallbackError;
                    await mongoose.connect(atlasGuessUri, { serverSelectionTimeoutMS: 12000 });
                }
            }

            return true;
        }
    } catch (error) {
        console.error(' Failed to connect to MongoDB:', error.message);
        console.warn(' Starting server without a database connection. API endpoints that depend on MongoDB will fail until the database is reachable.');
        return false;
    }
};

export default connectDB;