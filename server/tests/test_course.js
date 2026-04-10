const request = require("supertest");
const app = require("../server");

describe("Unit Test 2 - Course Management", () => {

  test("Should return health check successfully", async () => {
    const res = await request(app)
      .get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Skill Hub");
  });

  test("Should protect course creation without authentication", async () => {
    const res = await request(app)
      .post("/api/courses")
      .send({
        title: "Test Course",
        description: "Test description",
        price: 100
      });
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should return 404 for non-existent routes", async () => {
    const res = await request(app)
      .get("/api/nonexistent-route");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

});
