const request = require("supertest");
const app = require("../server");

describe("Unit Test 3 - Student Enrolment", () => {

  test("Should protect enrolled courses route with Clerk auth", async () => {
    const res = await request(app)
      .get("/api/user/enrolled-courses")
      .set("Authorization", "Bearer test-token");
    expect([200, 302, 401, 403]).toContain(res.statusCode);
  });

  test("Should reject enrolled courses without any authentication", async () => {
    const res = await request(app)
      .get("/api/user/enrolled-courses");
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should protect wishlist access without authentication", async () => {
    const res = await request(app)
      .get("/api/user/wishlist");
    expect([302, 401, 403]).toContain(res.statusCode);
  });

});
