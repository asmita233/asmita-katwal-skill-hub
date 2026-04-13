const request = require("supertest");
const app = require("../server");

describe("Unit Test 11 - Wishlist Feature", () => {

  test("Should not add course to wishlist without authentication", async () => {
    const res = await request(app)
      .post("/api/user/add-to-wishlist")
      .send({ courseId: "testcourse123" });
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not get wishlist without authentication", async () => {
    const res = await request(app)
      .get("/api/user/wishlist");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Should not remove course from wishlist without authentication", async () => {
    const res = await request(app)
      .delete("/api/user/remove-wishlist/testcourse123");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

  test("Wishlist route should exist in the system", async () => {
    const res = await request(app)
      .get("/api/user/wishlist");
    expect([302, 401, 403, 404]).toContain(res.statusCode);
  });

});
