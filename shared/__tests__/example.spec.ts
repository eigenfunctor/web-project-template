import { example } from "../src";

describe("example suite", () => {
  it("should run the example", () => {
    expect(example()).toEqual("hello example!");
  })
})
