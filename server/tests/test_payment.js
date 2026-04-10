const request = require("supertest");
const app = require("../server");

describe("Unit Test 4 - Stripe Payment", () => {

  test("Should protect checkout session without authentication", async () => {
    const res = await request(app)
      .post("/api/payment/create-checkout-session")
      .send({ courseId: "testid123" });
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should protect payment verification without auth", async () => {
    const res = await request(app)
      .post("/api/payment/verify-payment")
      .send({});
    expect([302, 401, 403]).toContain(res.statusCode);
  });

  test("Should protect purchase history without auth", async () => {
    const res = await request(app)
      .get("/api/payment/purchase-history");
    expect([302, 401, 403]).toContain(res.statusCode);
  });

});
