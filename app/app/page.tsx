"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function Home() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [cronjobs, setCronjobs] = useState<CronJob[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const API_BASE = "http://localhost:8080";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [newslettersRes, scrapersRes, cronjobsRes, usersRes] =
        await Promise.all([
          fetch(`${API_BASE}/newsletters`),
          fetch(`${API_BASE}/scrapers`),
          fetch(`${API_BASE}/cronjobs`),
          fetch(`${API_BASE}/users`),
        ]);

      if (newslettersRes.ok) setNewsletters(await newslettersRes.json());
      if (scrapersRes.ok) setScrapers(await scrapersRes.json());
      if (cronjobsRes.ok) setCronjobs(await cronjobsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
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
              { id: "users", name: "👤 Utilisateurs", icon: "👤" },
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
      </main>
    </div>
  );
}
