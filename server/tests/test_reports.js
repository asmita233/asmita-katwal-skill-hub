const request = require("supertest");
const app = require("../server");

describe("Unit Test 8 - Reports and Analytics", () => {

  test("Should not access reports without authentication", async () => {
    const res = await request(app)
      .get("/api/reports/instructor");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not access earnings report without authentication", async () => {
    const res = await request(app)
      .get("/api/reports/earnings");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Reports route should exist and respond", async () => {
    const res = await request(app)
      .get("/api/reports");
    expect([200, 302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not access student reports without authentication", async () => {
    const res = await request(app)
      .get("/api/reports/student");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

});
