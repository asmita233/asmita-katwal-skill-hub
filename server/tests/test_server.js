const request = require("supertest");
const app = require("../server");

describe("Unit Test 9 - Server Health and API Routes", () => {

  test("Server should be running and return health check", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown-route");
    expect(res.statusCode).toBe(404);
  });

  test("All courses API should be reachable", async () => {
    const res = await request(app).get("/api/courses/all");
    expect(res.statusCode).toBe(200);
  });

  test("Should return proper JSON response format", async () => {
    const res = await request(app).get("/api/courses/all");
    expect(res.headers["content-type"]).toMatch(/json/);
  });

});
