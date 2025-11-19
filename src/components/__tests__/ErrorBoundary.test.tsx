// @ts-nocheck
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";

function ProblemChild() {
  throw new Error("Boom");
}

describe("ErrorBoundary", () => {
  it("renders fallback when child throws", () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(
      screen.getByRole("alert", { name: /something went wrong/i })
    ).toBeInTheDocument();
  });
});
