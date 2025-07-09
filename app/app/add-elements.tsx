"use client";

import { useState } from "react";
import { API_BASE } from "../config/api";

interface Newsletter {
  id: number;
  name: string;
  description?: string;
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

interface Scraper {
  id: number;
  name: string;
  link: string;
  premium: boolean;
}

interface AddElementsPageProps {
  newsletters: Newsletter[];
  users: User[];
  scrapers?: Scraper[];
  onDataUpdate: () => void;
}

export default function AddElementsPage({
  newsletters,
  users,
  scrapers = [],
  onDataUpdate,
}: AddElementsPageProps) {
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

  const [cronJobForm, setCronJobForm] = useState({
    name: "",
    time: "",
    newsletterId: "",
    scraperIds: [] as number[],
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      showMessage("error", "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleCronJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/cronjobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cronJobForm.name,
          time: cronJobForm.time,
          newsletter_id: parseInt(cronJobForm.newsletterId),
          scraper_ids: cronJobForm.scraperIds,
        }),
      });

      if (response.ok) {
        showMessage("success", "Tâche cron créée avec succès !");
        setCronJobForm({
          name: "",
          time: "",
          newsletterId: "",
          scraperIds: [],
        });
        onDataUpdate();
      } else {
        const error = await response.json();
        showMessage("error", `Erreur: ${error.error}`);
      }
    } catch {
      showMessage("error", "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleScraperSelection = (scraperId: number, checked: boolean) => {
    if (checked) {
      setCronJobForm((prev) => ({
        ...prev,
        scraperIds: [...prev.scraperIds, scraperId],
      }));
    } else {
      setCronJobForm((prev) => ({
        ...prev,
        scraperIds: prev.scraperIds.filter((id) => id !== scraperId),
      }));
    }
  };

  // Classe CSS commune pour tous les inputs avec une meilleure lisibilité
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500 bg-white";

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

        <div className="flex space-x-4 mb-6 overflow-x-auto">
          {[
            { id: "newsletter", name: "📧 Newsletter", icon: "📧" },
            { id: "scraper", name: "🕷️ Scraper", icon: "🕷️" },
            { id: "cronjob", name: "⏰ Tâche Cron", icon: "⏰" },
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
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
                  className={inputClass}
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
                  className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
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
                      className={inputClass}
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
                      className={inputClass}
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
                      className={inputClass}
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
                      className={inputClass}
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
                      className={inputClass}
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
                      className={inputClass}
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

        {/* Section Tâche Cron */}
        {activeSection === "cronjob" && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ⏰ Créer une Tâche Cron
            </h3>
            <form onSubmit={handleCronJobSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la tâche
                  </label>
                  <input
                    type="text"
                    value={cronJobForm.name}
                    onChange={(e) =>
                      setCronJobForm({ ...cronJobForm, name: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Ex: Scraping quotidien"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fréquence (cron expression)
                  </label>
                  <input
                    type="text"
                    value={cronJobForm.time}
                    onChange={(e) =>
                      setCronJobForm({ ...cronJobForm, time: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Ex: 0 9 * * * (tous les jours à 9h)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: minute heure jour mois jour_semaine
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Newsletter associée
                </label>
                <select
                  value={cronJobForm.newsletterId}
                  onChange={(e) =>
                    setCronJobForm({
                      ...cronJobForm,
                      newsletterId: e.target.value,
                    })
                  }
                  className={inputClass}
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
                  Scrapers à exécuter
                </label>
                {scrapers.length === 0 ? (
                  <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800">Aucun scraper disponible</p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Créez d&apos;abord des scrapers pour les associer à cette
                      tâche
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {scrapers.map((scraper) => (
                      <label
                        key={scraper.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={cronJobForm.scraperIds.includes(scraper.id)}
                          onChange={(e) =>
                            handleScraperSelection(scraper.id, e.target.checked)
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {scraper.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {scraper.link}
                          </div>
                          {scraper.premium && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                              ⭐ Premium
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez les scrapers qui seront exécutés par cette tâche
                  cron
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || scrapers.length === 0}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Création..." : "Créer la Tâche Cron"}
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
                  className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
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
