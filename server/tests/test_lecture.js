const request = require("supertest");
const app = require("../server");

describe("Unit Test 14 - Lecture and Section Management", () => {

  test("Should not add lecture without authentication", async () => {
    const res = await request(app)
      .post("/api/courses/add-lecture")
      .send({ courseId: "testcourse123", title: "Test Lecture" });
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not delete lecture without authentication", async () => {
    const res = await request(app)
      .delete("/api/courses/delete-lecture/testlecture123");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not add section without authentication", async () => {
    const res = await request(app)
      .post("/api/courses/add-section")
      .send({ courseId: "testcourse123", title: "Chapter 1" });
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not update lecture without authentication", async () => {
    const res = await request(app)
      .put("/api/courses/update-lecture/testlecture123")
      .send({ title: "Updated Lecture" });
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

});
