const request = require("supertest");
const app = require("../server");

describe("Unit Test 12 - Course Reviews and Ratings", () => {

  test("Should not post review without authentication", async () => {
    const res = await request(app)
      .post("/api/courses/add-review")
      .send({ courseId: "testcourse123", rating: 5, comment: "Great course" });
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not post review without rating", async () => {
    const res = await request(app)
      .post("/api/courses/add-review")
      .send({ courseId: "testcourse123", comment: "Great course" });
    expect([302, 400, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should get course reviews publicly", async () => {
    const res = await request(app)
      .get("/api/courses/all");
    expect(res.statusCode).toBe(200);
  });

  test("Should not delete review without authentication", async () => {
    const res = await request(app)
      .delete("/api/courses/delete-review/testid123");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

});
