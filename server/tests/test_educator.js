const request = require("supertest");
const app = require("../server");

describe("Unit Test 13 - Educator Dashboard Routes", () => {

  test("Should not access educator dashboard without authentication", async () => {
    const res = await request(app)
      .get("/api/courses/educator/dashboard");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not get educator courses without authentication", async () => {
    const res = await request(app)
      .get("/api/courses/educator/my-courses");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not update course without authentication", async () => {
    const res = await request(app)
      .put("/api/courses/update/testcourse123")
      .send({ title: "Updated Title" });
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not toggle course publish without authentication", async () => {
    const res = await request(app)
      .patch("/api/courses/toggle/testcourse123");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

});
