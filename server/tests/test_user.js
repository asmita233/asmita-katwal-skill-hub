const request = require("supertest");
const app = require("../server");

describe("Unit Test 10 - User Routes Protection", () => {

  test("Should not access user profile without authentication", async () => {
    const res = await request(app).get("/api/user/profile");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not update user without authentication", async () => {
    const res = await request(app)
      .put("/api/user/update")
      .send({ name: "New Name" });
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not become educator without authentication", async () => {
    const res = await request(app)
      .post("/api/user/become-educator");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not get user data without authentication", async () => {
    const res = await request(app)
      .get("/api/users/data");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

});
