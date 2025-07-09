"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/config/api";

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
  scrapers?: Scraper[];
}

interface Newsletter {
  id: number;
  name: string;
  description?: string;
  cronjobs?: CronJob[];
}

export default function NewsletterDetail() {
  const { id } = useParams();
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/newsletters/${id}`)
      .then((res) => res.json())
      .then((data) => setNewsletter(data))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (!newsletter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Newsletter introuvable
          </h1>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
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
                📧 {newsletter.name}
              </h1>
              {newsletter.description && (
                <p className="text-gray-600 mt-1">{newsletter.description}</p>
              )}
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              ⏰ Tâches Cron
            </h2>
          </div>
          <div className="p-6">
            {!newsletter.cronjobs || newsletter.cronjobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⏰</div>
                <p className="text-gray-500 text-lg">
                  Aucune tâche cron associée
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Créez des tâches cron pour automatiser le scraping
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {newsletter.cronjobs.map((cron: CronJob) => (
                  <div
                    key={cron.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          ⏰ {cron.name}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Fréquence :{" "}
                          <span className="font-medium">{cron.time}</span>
                        </p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        ID: {cron.id}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        🕷️ Scrapers associés
                      </h4>
                      {!cron.scrapers || cron.scrapers.length === 0 ? (
                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl mb-2">🕷️</div>
                          <p className="text-gray-500">Aucun scraper associé</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {cron.scrapers.map((scraper: Scraper) => (
                            <div
                              key={scraper.id}
                              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="font-medium text-gray-900 flex items-center">
                                    🕷️ {scraper.name}
                                    {scraper.premium && (
                                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                        ⭐ Premium
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">URL:</span>{" "}
                                    {scraper.link}
                                  </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  ID: {scraper.id}
                                </span>
                              </div>

                              {scraper.schema && (
                                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                                  <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    📊 Schéma de données
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="font-medium">
                                        Container:
                                      </span>{" "}
                                      {scraper.schema.container}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Title:
                                      </span>{" "}
                                      {scraper.schema.title}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Description:
                                      </span>{" "}
                                      {scraper.schema.description}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Image:
                                      </span>{" "}
                                      {scraper.schema.image}
                                    </div>
                                    <div>
                                      <span className="font-medium">Time:</span>{" "}
                                      {scraper.schema.time}
                                    </div>
                                    <div>
                                      <span className="font-medium">Link:</span>{" "}
                                      {scraper.schema.link}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
