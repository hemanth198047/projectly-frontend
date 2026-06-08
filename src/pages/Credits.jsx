import PageHeader from "../components/PageHeader";

export default function Credits() {
  return (
    <div className="credits-page">
      <PageHeader
        icon="🙏"
        title="Credits"
        description="ProjectsNGoals is built using the following open source tools and resources."
      />
      <section className="credits-section">
        <h2>Icons</h2>
        <div className="credits-card">
          <div className="credits-item">
            <span className="credits-name">Icons by FlatIcon</span>
            <span className="credits-desc">
              Icons used in this application are provided by{" "}
              <a
                href="https://www.flaticon.com"
                target="_blank"
                rel="noreferrer"
              >
                www.flaticon.com
              </a>
            </span>
          </div>
          <div className="credits-item">
            <span className="credits-name">Icons by FlatIcon</span>
            <span className="credits-desc">
              Icons used in this application are provided by{" "}
              <a
                href="https://www.flaticon.com/free-icons/advertising"
                title="advertising icons"
              >
                Advertising icons created by Roundicons Premium - Flaticon
              </a>
            </span>
          </div>
        </div>
      </section>

      <section className="credits-section">
        <h2>Frontend</h2>
        <div className="credits-card">
          {[
            { name: "React", url: "https://react.dev", desc: "UI library" },
            { name: "Vite", url: "https://vitejs.dev", desc: "Build tool" },
            {
              name: "React Router",
              url: "https://reactrouter.com",
              desc: "Client-side routing",
            },
            {
              name: "Axios",
              url: "https://axios-http.com",
              desc: "HTTP client",
            },
            {
              name: "date-fns",
              url: "https://date-fns.org",
              desc: "Date utility library",
            },
          ].map((item) => (
            <div className="credits-item" key={item.name}>
              <span className="credits-name">
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.name}
                </a>
              </span>
              <span className="credits-desc">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="credits-section">
        <h2>Backend</h2>
        <div className="credits-card">
          {[
            {
              name: "Spring Boot",
              url: "https://spring.io/projects/spring-boot",
              desc: "Java framework",
            },
            {
              name: "MongoDB Atlas",
              url: "https://www.mongodb.com/cloud/atlas",
              desc: "Cloud database",
            },
            {
              name: "Lombok",
              url: "https://projectlombok.org",
              desc: "Java boilerplate reduction",
            },
          ].map((item) => (
            <div className="credits-item" key={item.name}>
              <span className="credits-name">
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.name}
                </a>
              </span>
              <span className="credits-desc">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
