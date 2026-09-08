const setConfig = (general: Record<string, unknown>) =>
  cy.setCookie("cypressConfigOverride", JSON.stringify({ general }));

describe("Redirect to another instance", () => {
  it("redirects the home page to the other instance", () => {
    setConfig({
      redirect_to_instance: "https://gath.io",
      show_public_event_list: false,
    });
    // cy.request rather than cy.visit: Cypress won't follow a redirect to
    // another origin. It normalises a bare origin to have a trailing slash,
    // hence the optional one here.
    cy.request({ url: "/", followRedirect: false }).then((response) => {
      expect(response.status).to.eq(302);
      expect(response.redirectedToUrl).to.match(/^https:\/\/gath\.io\/?$/);
    });
  });

  it("points the 'Create an event' button at the other instance", () => {
    // A trailing slash on the configured URL must not produce '//new'.
    setConfig({
      redirect_to_instance: "https://gath.io/",
      show_public_event_list: false,
    });
    cy.visit("/about");
    cy.get("#sidebar__nav")
      .find("a.button--primary")
      .should("have.attr", "href", "https://gath.io/new");
  });

  it("keeps serving the magic link form at /new", () => {
    setConfig({
      redirect_to_instance: "https://gath.io",
      creator_email_addresses: ["test@test.com"],
    });
    cy.visit("/new");
    cy.get("h2").should("contain", "Request a link to create a new event");
  });

  it("ignores a value which isn't an absolute http(s) URL", () => {
    setConfig({
      redirect_to_instance: "gath.io",
      show_public_event_list: false,
    });
    cy.request({ url: "/", followRedirect: false }).then((response) => {
      expect(response.status).to.eq(200);
    });
    cy.visit("/");
    cy.get("#sidebar__nav")
      .find("a.button--primary")
      .should("have.attr", "href", "/new");
  });

  it("leaves the public event list as the home page when it's enabled", () => {
    setConfig({
      redirect_to_instance: "https://gath.io",
      show_public_event_list: true,
    });
    cy.request({ url: "/", followRedirect: false }).then((response) => {
      expect(response.status).to.eq(302);
      expect(response.redirectedToUrl).to.contain("/events");
    });
  });

  it("changes nothing when unset", () => {
    cy.request({ url: "/", followRedirect: false }).then((response) => {
      expect(response.status).to.eq(200);
    });
    cy.visit("/");
    cy.get("#sidebar__nav")
      .find("a.button--primary")
      .should("have.attr", "href", "/new");
  });
});
