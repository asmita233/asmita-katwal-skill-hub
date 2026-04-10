const request = require("supertest");
const app = require("../server");

describe("Unit Test 6 - Certificate Generation", () => {

  test("Should protect certificate generation without authentication", async () => {
    const res = await request(app)
      .post("/api/certificates/generate")
      .send({ courseId: "testcourse123" });
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should protect fetching certificates without auth", async () => {
    const res = await request(app)
      .get("/api/certificates/my-certificates");
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should protect certificate eligibility check without auth", async () => {
    const res = await request(app)
      .get("/api/certificates/eligibility/testcourse123");
    expect([302, 401, 403]).toContain(res.statusCode);
  });

});
