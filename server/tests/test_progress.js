const request = require("supertest");
const app = require("../server");

describe("Unit Test 5 - Progress Tracking", () => {

  test("Should protect progress update without authentication", async () => {
    const res = await request(app)
      .post("/api/user/update-progress")
      .send({
        courseId: "testcourse123",
        lectureId: "lecture001"
      });
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should protect progress update with invalid token", async () => {
    const res = await request(app)
      .post("/api/user/update-progress")
      .set("Authorization", "Bearer invalid-token")
      .send({});
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Health check endpoint should remain accessible", async () => {
    const res = await request(app)
      .get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

});
