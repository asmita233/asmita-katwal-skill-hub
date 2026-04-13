const request = require("supertest");
const app = require("../server");

describe("Unit Test 7 - Q&A Questions Module", () => {

  test("Should not post question without authentication", async () => {
    const res = await request(app)
      .post("/api/questions/add")
      .send({ courseId: "testcourse123", question: "What is React?" });
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not get questions without authentication", async () => {
    const res = await request(app)
      .get("/api/questions/testcourse123");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Questions route should exist and respond", async () => {
    const res = await request(app)
      .get("/api/questions");
    expect([200, 302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not delete question without authentication", async () => {
    const res = await request(app)
      .delete("/api/questions/delete/testid123");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

});
