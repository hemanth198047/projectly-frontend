import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Goals from "./pages/Goals";
import Categories from "./pages/Categories";
import Credits from "./pages/Credits";
import Breadcrumb from "./components/Breadcrumb";
import Search from "./pages/Search";
import "./App.css";
import { useState, useEffect } from "react";
import { getNotificationCounts } from "./api/notifications";
import SidebarBadge from "./components/SidebarBadge";
import ThemeToggle from "./components/ThemeToggle";
import Calendar from "./pages/Calendar";
import Kanban from "./pages/Kanban";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [badges, setBadges] = useState({
    overdue: 0,
    today: 0,
    inProgress: 0,
    overdueProjects: 0,
  });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await getNotificationCounts();
        const data = res.data;
        setBadges({
          overdue:
            (data.overdueTasks?.length || 0) +
            (data.overdueProjects?.length || 0) +
            (data.overdueGoals?.length || 0),
          today: data.todayTasks?.length || 0,
          inProgress: data.inProgressTasks || 0,
          overdueProjects: data.overdueProjects?.length || 0,
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <nav className={`sidebar ${menuOpen ? "open" : ""}`}>
          <div className="sidebar-top">
            <div className="logo">
              Projects<span>&Goals</span>
            </div>
            <button className="menu-close" onClick={() => setMenuOpen(false)}>
              ✕
            </button>
          </div>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>
            📊 Dashboard
            <SidebarBadge count={badges.overdue} color="#ef4444" />
          </NavLink>
          <NavLink to="/projects" onClick={() => setMenuOpen(false)}>
            📁 Projects
            <SidebarBadge count={badges.overdueProjects} color="#f59e0b" />
          </NavLink>
          <NavLink to="/tasks" onClick={() => setMenuOpen(false)}>
            ✅ Tasks
            <SidebarBadge count={badges.inProgress} color="#f59e0b" />
          </NavLink>
          <NavLink to="/kanban" onClick={() => setMenuOpen(false)}>
            🗂️ Kanban
          </NavLink>
          <NavLink to="/goals" onClick={() => setMenuOpen(false)}>
            🎯 Goals
            <SidebarBadge count={badges.today} color="#10b981" />
          </NavLink>
          <NavLink to="/calendar" onClick={() => setMenuOpen(false)}>
            📅 Calendar
          </NavLink>
          <NavLink to="/categories" onClick={() => setMenuOpen(false)}>
            🏷️ Project Categories
          </NavLink>
          <div style={{ flex: 1 }}></div>
          <NavLink to="/credits" onClick={() => setMenuOpen(false)}>
            🙏 Credits
          </NavLink>
        </nav>

        {menuOpen && (
          <div className="overlay" onClick={() => setMenuOpen(false)} />
        )}

        <div className="content-wrapper">
          <div className="mobile-header">
            <button className="menu-btn" onClick={() => setMenuOpen(true)}>
              ☰
            </button>
            <span className="mobile-logo">ProjectsNGoals</span>
          </div>
          <div className="topbar">
            <div style={{ flex: 1 }} />
            <Link to="/search" className="topbar-search-btn">
              🔍 Search
            </Link>
            <ThemeToggle />
          </div>
          <main className="main-content">
            <Breadcrumb />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/search" element={<Search />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/calendar" element={<Calendar />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
