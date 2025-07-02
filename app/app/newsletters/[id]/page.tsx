"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function NewsletterDetail() {
  const { id } = useParams();
  const [newsletter, setNewsletter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8080/newsletters/${id}`)
      .then((res) => res.json())
      .then((data) => setNewsletter(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (!newsletter)
    return <div className="p-8 text-center">Newsletter introuvable</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">{newsletter.name}</h1>
      {newsletter.description && (
        <p className="mb-6 text-gray-600">{newsletter.description}</p>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-4">⏰ Tâches Cron</h2>
      {!newsletter.cronjobs || newsletter.cronjobs.length === 0 ? (
        <p className="text-gray-500">Aucune tâche cron associée.</p>
      ) : (
        newsletter.cronjobs.map((cron: any) => (
          <div key={cron.id} className="mb-6 border-b pb-4">
            <h3 className="text-lg font-bold">{cron.name}</h3>
            <p className="text-gray-500">Fréquence : {cron.time}</p>
            <div className="mt-2">
              <h4 className="font-semibold">🕷️ Scrapers associés :</h4>
              {!cron.scrapers || cron.scrapers.length === 0 ? (
                <p className="text-gray-400">Aucun scraper.</p>
              ) : (
                cron.scrapers.map((scraper: any) => (
                  <div
                    key={scraper.id}
                    className="mt-2 pl-4 border-l-2 border-indigo-200"
                  >
                    <div className="font-medium">{scraper.name}</div>
                    <div className="text-sm text-gray-600">
                      Lien : {scraper.link}
                    </div>
                    <div className="text-sm text-gray-600">
                      Premium : {scraper.premium ? "⭐ Oui" : "Non"}
                    </div>
                    {scraper.schema && (
                      <div className="mt-1 text-xs text-gray-500">
                        <div>
                          📊 <b>Schema</b> :
                        </div>
                        <ul className="ml-2">
                          <li>Container : {scraper.schema.container}</li>
                          <li>Title : {scraper.schema.title}</li>
                          <li>Description : {scraper.schema.description}</li>
                          <li>Image : {scraper.schema.image}</li>
                          <li>Time : {scraper.schema.time}</li>
                          <li>Link : {scraper.schema.link}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
