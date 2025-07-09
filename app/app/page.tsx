"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AddElementsPage from "./add-elements";
import { API_BASE } from "@/config/api";

interface Newsletter {
  id: number;
  name: string;
  description?: string;
  cronjobs?: {
    id: number;
    name: string;
    time: string;
  }[];
  users?: {
    id: number;
    email: string;
  }[];
}

interface ScraperSchema {
  id: number;
  container: string;
  title: string;
  description: string;
  image: string;
  time: string;
  link: string;
}

interface Scraper {
  id: number;
  name: string;
  link: string;
  premium: boolean;
  schema?: ScraperSchema;
}

interface CronJob {
  id: number;
  name: string;
  time: string;
  newsletter?: {
    id: number;
    name: string;
    description: string;
  };
  scrapers?: Scraper[];
}

interface User {
  id: number;
  email: string;
  newsletter?: {
    id: number;
    name: string;
    description: string;
  };
}

interface CronTask {
  id: number;
  name: string;
  time: string;
  scraper_id: number;
  scraper_name: string;
  status: string;
  last_run?: string;
  next_run?: string;
  entry_id: number;
}

// Composant pour ajouter des éléments
function AddElementsPageFunction({
  newsletters,
  users,
  onDataUpdate,
}: {
  newsletters: Newsletter[];
  users: User[];
  onDataUpdate: () => void;
}) {
  const [activeSection, setActiveSection] = useState("newsletter");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // États pour les formulaires
  const [newsletterForm, setNewsletterForm] = useState({
    name: "",
    description: "",
  });

  const [scraperForm, setScraperForm] = useState({
    name: "",
    link: "",
    premium: false,
    schema: {
      container: "",
      title: "",
      description: "",
      image: "",
      time: "",
      link: "",
    },
  });

  const [userForm, setUserForm] = useState({
    email: "",
    newsletterId: "",
  });

  const [addUserToNewsletterForm, setAddUserToNewsletterForm] = useState({
    newsletterId: "",
    userId: "",
  });

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/newsletters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newsletterForm),
      });

      if (response.ok) {
        showMessage("success", "Newsletter créée avec succès !");
        setNewsletterForm({ name: "", description: "" });
        onDataUpdate();
      } else {
        const error = await response.json();
        showMessage("error", `Erreur: ${error.error}`);
      }
    } catch (error) {
      showMessage("error", "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleScraperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // D'abord créer le schema
      const schemaResponse = await fetch(`${API_BASE}/schemas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scraperForm.schema),
      });

      if (!schemaResponse.ok) {
        const error = await schemaResponse.json();
        showMessage("error", `Erreur création schema: ${error.error}`);
        return;
      }

      const schema = await schemaResponse.json();

      // Puis créer le scraper
      const scraperResponse = await fetch(`${API_BASE}/scrapers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scraperForm.name,
          link: scraperForm.link,
          premium: scraperForm.premium,
          schema_id: schema.id,
        }),
      });

      if (scraperResponse.ok) {
        showMessage("success", "Scraper créé avec succès !");
        setScraperForm({
          name: "",
          link: "",
          premium: false,
          schema: {
            container: "",
            title: "",
            description: "",
            image: "",
            time: "",
            link: "",
          },
        });
        onDataUpdate();
      } else {
        const error = await scraperResponse.json();
        showMessage("error", `Erreur: ${error.error}`);
      }
    } catch (error) {
      showMessage("error", "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userForm.email,
          newsletter_id: parseInt(userForm.newsletterId),
        }),
      });

      if (response.ok) {
        showMessage("success", "Utilisateur créé avec succès !");
        setUserForm({ email: "", newsletterId: "" });
        onDataUpdate();
      } else {
        const error = await response.json();
        showMessage("error", `Erreur: ${error.error}`);
      }
    } catch (error) {
      showMessage("error", "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserToNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/newsletters/${addUserToNewsletterForm.newsletterId}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_ids: [parseInt(addUserToNewsletterForm.userId)],
          }),
        }
      );

      if (response.ok) {
        showMessage(
          "success",
          "Utilisateur ajouté à la newsletter avec succès !"
        );
        setAddUserToNewsletterForm({ newsletterId: "", userId: "" });
        onDataUpdate();
      } else {
        const error = await response.json();
        showMessage("error", `Erreur: ${error.error}`);
      }
    } catch (error) {
      showMessage("error", "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Message de notification */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Navigation des sections */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          ➕ Ajouter des Éléments
        </h2>

        <div className="flex space-x-4 mb-6">
          {[
            { id: "newsletter", name: "📧 Newsletter", icon: "📧" },
            { id: "scraper", name: "🕷️ Scraper", icon: "🕷️" },
            { id: "user", name: "👤 Utilisateur", icon: "👤" },
            {
              id: "addUserToNewsletter",
              name: "🔗 Ajouter Utilisateur à Newsletter",
              icon: "🔗",
            },
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>

        {/* Section Newsletter */}
        {activeSection === "newsletter" && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              📧 Créer une Newsletter
            </h3>
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la newsletter
                </label>
                <input
                  type="text"
                  value={newsletterForm.name}
                  onChange={(e) =>
                    setNewsletterForm({
                      ...newsletterForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newsletterForm.description}
                  onChange={(e) =>
                    setNewsletterForm({
                      ...newsletterForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Création..." : "Créer la Newsletter"}
              </button>
            </form>
          </div>
        )}

        {/* Section Scraper */}
        {activeSection === "scraper" && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🕷️ Créer un Scraper
            </h3>
            <form onSubmit={handleScraperSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du scraper
                  </label>
                  <input
                    type="text"
                    value={scraperForm.name}
                    onChange={(e) =>
                      setScraperForm({ ...scraperForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL du site
                  </label>
                  <input
                    type="url"
                    value={scraperForm.link}
                    onChange={(e) =>
                      setScraperForm({ ...scraperForm, link: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="premium"
                  checked={scraperForm.premium}
                  onChange={(e) =>
                    setScraperForm({
                      ...scraperForm,
                      premium: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="premium"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Premium (nécessite navigateur headless)
                </label>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  📊 Configuration du Schema
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Container CSS
                    </label>
                    <input
                      type="text"
                      value={scraperForm.schema.container}
                      onChange={(e) =>
                        setScraperForm({
                          ...scraperForm,
                          schema: {
                            ...scraperForm.schema,
                            container: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder=".article, .post, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélecteur Titre
                    </label>
                    <input
                      type="text"
                      value={scraperForm.schema.title}
                      onChange={(e) =>
                        setScraperForm({
                          ...scraperForm,
                          schema: {
                            ...scraperForm.schema,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="h1, .title, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélecteur Description
                    </label>
                    <input
                      type="text"
                      value={scraperForm.schema.description}
                      onChange={(e) =>
                        setScraperForm({
                          ...scraperForm,
                          schema: {
                            ...scraperForm.schema,
                            description: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder=".description, p, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélecteur Image
                    </label>
                    <input
                      type="text"
                      value={scraperForm.schema.image}
                      onChange={(e) =>
                        setScraperForm({
                          ...scraperForm,
                          schema: {
                            ...scraperForm.schema,
                            image: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="img, .image, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélecteur Date
                    </label>
                    <input
                      type="text"
                      value={scraperForm.schema.time}
                      onChange={(e) =>
                        setScraperForm({
                          ...scraperForm,
                          schema: {
                            ...scraperForm.schema,
                            time: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder=".date, time, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélecteur Lien
                    </label>
                    <input
                      type="text"
                      value={scraperForm.schema.link}
                      onChange={(e) =>
                        setScraperForm({
                          ...scraperForm,
                          schema: {
                            ...scraperForm.schema,
                            link: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="a, .link, etc."
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Création..." : "Créer le Scraper"}
              </button>
            </form>
          </div>
        )}

        {/* Section Utilisateur */}
        {activeSection === "user" && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              👤 Créer un Utilisateur
            </h3>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Newsletter
                </label>
                <select
                  value={userForm.newsletterId}
                  onChange={(e) =>
                    setUserForm({ ...userForm, newsletterId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Sélectionner une newsletter</option>
                  {newsletters.map((newsletter) => (
                    <option key={newsletter.id} value={newsletter.id}>
                      {newsletter.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Création..." : "Créer l'Utilisateur"}
              </button>
            </form>
          </div>
        )}

        {/* Section Ajouter Utilisateur à Newsletter */}
        {activeSection === "addUserToNewsletter" && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🔗 Ajouter un Utilisateur à une Newsletter
            </h3>
            <form onSubmit={handleAddUserToNewsletter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Newsletter
                </label>
                <select
                  value={addUserToNewsletterForm.newsletterId}
                  onChange={(e) =>
                    setAddUserToNewsletterForm({
                      ...addUserToNewsletterForm,
                      newsletterId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Sélectionner une newsletter</option>
                  {newsletters.map((newsletter) => (
                    <option key={newsletter.id} value={newsletter.id}>
                      {newsletter.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilisateur
                </label>
                <select
                  value={addUserToNewsletterForm.userId}
                  onChange={(e) =>
                    setAddUserToNewsletterForm({
                      ...addUserToNewsletterForm,
                      userId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Ajout..." : "Ajouter l'Utilisateur"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [cronjobs, setCronjobs] = useState<CronJob[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cronTasks, setCronTasks] = useState<CronTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [newslettersRes, scrapersRes, cronjobsRes, usersRes, cronTasksRes] =
        await Promise.all([
          fetch(`${API_BASE}/newsletters`),
          fetch(`${API_BASE}/scrapers`),
          fetch(`${API_BASE}/cronjobs`),
          fetch(`${API_BASE}/users`),
          fetch(`${API_BASE}/cron-tasks`),
        ]);

      if (newslettersRes.ok) setNewsletters(await newslettersRes.json());
      if (scrapersRes.ok) setScrapers(await scrapersRes.json());
      if (cronjobsRes.ok) setCronjobs(await cronjobsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (cronTasksRes.ok) setCronTasks(await cronTasksRes.json());
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚀 Scraper Newsletter
              </h1>
              <p className="text-gray-600">
                Gestionnaire de scraping et newsletters
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "dashboard", name: "📊 Dashboard", icon: "📊" },
              { id: "newsletters", name: "📧 Newsletters", icon: "📧" },
              { id: "scrapers", name: "🕷️ Scrapers", icon: "🕷️" },
              { id: "cronjobs", name: "⏰ Cron Jobs", icon: "⏰" },
              { id: "cron-tasks", name: "🔄 Tâches Cron", icon: "🔄" },
              { id: "users", name: "👤 Utilisateurs", icon: "👤" },
              { id: "add", name: "➕ Ajouter", icon: "➕" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📧</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Newsletters
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {newsletters.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">🕷️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scrapers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {scrapers.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">⏰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cron Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cronjobs.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Utilisateurs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "newsletters" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                📧 Newsletters
              </h2>
            </div>
            <div className="p-6">
              {newsletters.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucune newsletter trouvée
                </p>
              ) : (
                <div className="grid gap-4">
                  {newsletters.map((newsletter) => (
                    <Link
                      key={newsletter.id}
                      href={`/newsletters/${newsletter.id}`}
                    >
                      <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {newsletter.name}
                            </h3>
                            {newsletter.description && (
                              <p className="text-gray-600 mt-1">
                                {newsletter.description}
                              </p>
                            )}
                            <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                              <span>
                                📊 {newsletter.cronjobs?.length || 0} cron jobs
                              </span>
                              <span>
                                👤 {newsletter.users?.length || 0} utilisateurs
                              </span>
                            </div>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            ID: {newsletter.id}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "scrapers" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">🕷️ Scrapers</h2>
            </div>
            <div className="p-6">
              {scrapers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucun scraper trouvé
                </p>
              ) : (
                <div className="grid gap-4">
                  {scrapers.map((scraper) => (
                    <div
                      key={scraper.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {scraper.name}
                          </h3>
                          <p className="text-gray-600 mt-1">{scraper.link}</p>
                          <div className="mt-2 flex space-x-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                scraper.premium
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {scraper.premium ? "⭐ Premium" : "🆓 Gratuit"}
                            </span>
                            {scraper.schema && (
                              <span className="text-gray-500">
                                📊 Schema: {scraper.schema.container}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          ID: {scraper.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "cronjobs" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                ⏰ Cron Jobs
              </h2>
            </div>
            <div className="p-6">
              {cronjobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucun cron job trouvé
                </p>
              ) : (
                <div className="grid gap-4">
                  {cronjobs.map((cronjob) => (
                    <div
                      key={cronjob.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {cronjob.name}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            ⏰ {cronjob.time}
                          </p>
                          <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                            <span>
                              📧 Newsletter: {cronjob.newsletter?.name || "N/A"}
                            </span>
                            <span>
                              🕷️ {cronjob.scrapers?.length || 0} scrapers
                            </span>
                          </div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          ID: {cronjob.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                👤 Utilisateurs
              </h2>
            </div>
            <div className="p-6">
              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucun utilisateur trouvé
                </p>
              ) : (
                <div className="grid gap-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {user.email}
                          </h3>
                          <div className="mt-2 text-sm text-gray-500">
                            <span>
                              📧 Newsletter: {user.newsletter?.name || "N/A"}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          ID: {user.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "cron-tasks" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  🔄 Tâches Cron - Monitoring
                </h2>
                <button
                  onClick={fetchData}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Actualiser</span>
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>
                    En cours:{" "}
                    {cronTasks.filter((t) => t.status === "running").length}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span>
                    Arrêtées:{" "}
                    {cronTasks.filter((t) => t.status === "stopped").length}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  <span>
                    Terminées:{" "}
                    {cronTasks.filter((t) => t.status === "completed").length}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span>
                    Erreurs:{" "}
                    {cronTasks.filter((t) => t.status === "error").length}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              {cronTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucune tâche cron trouvée
                </p>
              ) : (
                <div className="grid gap-4">
                  {cronTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {task.name}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === "running"
                                  ? "bg-green-100 text-green-800"
                                  : task.status === "stopped"
                                  ? "bg-gray-100 text-gray-800"
                                  : task.status === "completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {task.status === "running" && "🟢 En cours"}
                              {task.status === "stopped" && "⏸️ Arrêté"}
                              {task.status === "completed" && "✅ Terminé"}
                              {task.status === "error" && "❌ Erreur"}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">
                            ⏰ {task.time} | 🕷️ {task.scraper_name}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">
                                Dernière exécution:
                              </span>
                              <br />
                              {task.last_run
                                ? new Date(task.last_run).toLocaleString(
                                    "fr-FR"
                                  )
                                : "Jamais"}
                            </div>
                            <div>
                              <span className="font-medium">
                                Prochaine exécution:
                              </span>
                              <br />
                              {task.next_run
                                ? new Date(task.next_run).toLocaleString(
                                    "fr-FR"
                                  )
                                : "Non planifiée"}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                            ID: {task.id}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(
                                    `${API_BASE}/cron-tasks/${task.id}/start`,
                                    { method: "POST" }
                                  );
                                  if (response.ok) {
                                    // Afficher un message de succès temporaire
                                    const button =
                                      event?.target as HTMLButtonElement;
                                    button.textContent = "✅ Démarré !";
                                    button.disabled = true;
                                    button.className =
                                      "px-3 py-1 bg-green-500 text-white text-xs rounded opacity-50";

                                    setTimeout(() => {
                                      fetchData(); // Rafraîchir les données
                                    }, 1000);
                                  } else {
                                    alert(
                                      "Erreur lors du démarrage de la tâche"
                                    );
                                  }
                                } catch (error) {
                                  console.error(
                                    "Erreur lors du démarrage:",
                                    error
                                  );
                                  alert(
                                    "Erreur de connexion lors du démarrage"
                                  );
                                }
                              }}
                              disabled={task.status === "running"}
                              className={`px-3 py-1 text-white text-xs rounded transition-colors ${
                                task.status === "running"
                                  ? "bg-green-500 opacity-50 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {task.status === "running"
                                ? "🟢 En cours"
                                : "▶️ Démarrer"}
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(
                                    `${API_BASE}/cron-tasks/${task.id}/stop`,
                                    { method: "POST" }
                                  );
                                  if (response.ok) {
                                    // Afficher un message de succès temporaire
                                    const button =
                                      event?.target as HTMLButtonElement;
                                    button.textContent = "⏸️ Arrêté !";
                                    button.disabled = true;
                                    button.className =
                                      "px-3 py-1 bg-yellow-500 text-white text-xs rounded opacity-50";

                                    setTimeout(() => {
                                      fetchData(); // Rafraîchir les données
                                    }, 1000);
                                  } else {
                                    alert("Erreur lors de l'arrêt de la tâche");
                                  }
                                } catch (error) {
                                  console.error(
                                    "Erreur lors de l'arrêt:",
                                    error
                                  );
                                  alert("Erreur de connexion lors de l'arrêt");
                                }
                              }}
                              disabled={task.status === "stopped"}
                              className={`px-3 py-1 text-white text-xs rounded transition-colors ${
                                task.status === "stopped"
                                  ? "bg-yellow-500 opacity-50 cursor-not-allowed"
                                  : "bg-yellow-600 hover:bg-yellow-700"
                              }`}
                            >
                              {task.status === "stopped"
                                ? "⏸️ Arrêté"
                                : "⏸️ Arrêter"}
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible."
                                  )
                                ) {
                                  try {
                                    const response = await fetch(
                                      `${API_BASE}/cron-tasks/${task.id}`,
                                      { method: "DELETE" }
                                    );
                                    if (response.ok) {
                                      // Afficher un message de succès temporaire
                                      const button =
                                        event?.target as HTMLButtonElement;
                                      button.textContent = "🗑️ Supprimé !";
                                      button.disabled = true;
                                      button.className =
                                        "px-3 py-1 bg-red-500 text-white text-xs rounded opacity-50";

                                      setTimeout(() => {
                                        fetchData(); // Rafraîchir les données
                                      }, 1000);
                                    } else {
                                      alert(
                                        "Erreur lors de la suppression de la tâche"
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Erreur lors de la suppression:",
                                      error
                                    );
                                    alert(
                                      "Erreur de connexion lors de la suppression"
                                    );
                                  }
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "add" && (
          <AddElementsPage
            newsletters={newsletters}
            users={users}
            scrapers={scrapers}
            onDataUpdate={fetchData}
          />
        )}
      </main>
    </div>
  );
}
