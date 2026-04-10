const request = require("supertest");
const app = require("../server");

describe("Unit Test 1 - User Authentication", () => {

  test("Should protect user profile route without authentication", async () => {
    const res = await request(app)
      .get("/api/user/me");
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should protect enrolled courses route without authentication", async () => {
    const res = await request(app)
      .get("/api/user/enrolled-courses");
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should protect progress update without authentication", async () => {
    const res = await request(app)
      .post("/api/user/update-progress")
      .send({
        courseId: "testcourse123",
        lectureId: "lecture001"
      });
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should protect become-educator route without authentication", async () => {
    const res = await request(app)
      .post("/api/user/become-educator");
    expect([302, 401, 403]).toContain(res.statusCode);
  });

});
