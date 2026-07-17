"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const instagramUrl = "https://www.instagram.com/houseofeon_india/";
const reelsUrl = "https://www.instagram.com/houseofeon_india/reels/";

type ReelItem = {
  url: string;
  image: string;
};

const reels: ReelItem[] = [
  {
    url: "https://www.instagram.com/reel/DP6QhDbknPJ/",
    image: "/social/reel-1.png",
  },
  {
    url: "https://www.instagram.com/reel/DP6Kp3CAaOU/",
    image: "/social/reel-2.png",
  },
  {
    url: "https://www.instagram.com/reel/DPtYwebk-B7/",
    image: "/social/reel-3.png",
  },
  {
    url: "https://www.instagram.com/reel/DPaUjzMk3D4/",
    image: "/social/reel-4.png",
  },
  {
    url: "https://www.instagram.com/reel/DPWZ7lmE9ee/",
    image: "/social/reel-5.png",
  },
  {
    url: "https://www.instagram.com/reel/DPWQVz_E56G/",
    image: "/social/reel-6.png",
  },
  {
    url: "https://www.instagram.com/reel/DPTxbp9jBVV/",
    image: "/social/reel-7.png",
  },
  {
    url: "https://www.instagram.com/reel/DO2fXEmEu_d/",
    image: "/social/reel-8.png",
  },
  {
    url: "https://www.instagram.com/reel/DO2dApiAVNS/",
    image: "/social/reel-9.png",
  },
  {
    url: "https://www.instagram.com/reel/DMQEAYQzV1Z/",
    image: "/social/reel-10.png",
  },
  {
    url: "https://www.instagram.com/reel/DLccbaMBcS6/",
    image: "/social/reel-11.png",
  },
  {
    url: "https://www.instagram.com/reel/DKetVViRClN/",
    image: "/social/reel-12.png",
  },
  {
    url: "https://www.instagram.com/reel/DKE6JKxx9Wq/",
    image: "/social/reel-13.png",
  },
  {
    url: "https://www.instagram.com/reel/DJgulhLRRXH/",
    image: "/social/reel-14.png",
  },
];

const cardCopy = [
  {
    label: "Instagram Reel",
    title: "Real reactions. Real confidence.",
    text: "Watch House of Eon perfume moments from real Instagram content.",
  },
  {
    label: "Creator Moment",
    title: "Before you buy, see the vibe.",
    text: "Explore the bottle, mood and presence of House of Eon in real life.",
  },
  {
    label: "Social Proof",
    title: "Loved by fragrance lovers.",
    text: "Discover how House of Eon fits office wear, evening plans and everyday style.",
  },
];

function getRandomReels() {
  const shuffled = [...reels].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function ReelThumbnail({
  image,
  label,
}: {
  image: string;
  label: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!image || imageFailed) {
    return null;
  }

  return (
    <>
      <Image
        src={image}
        alt={`House of Eon Instagram reel - ${label}`}
        fill
        className="social-reel-image"
        sizes="(max-width: 860px) 86vw, 31vw"
        onError={() => setImageFailed(true)}
      />

      <div className="social-reel-overlay" />
    </>
  );
}

export default function SocialProofSection() {
  const [selectedReels, setSelectedReels] = useState<ReelItem[]>([]);

  useEffect(() => {
    setSelectedReels(getRandomReels());
  }, []);

  const reelsToShow = useMemo(() => {
    const activeReels = selectedReels.length ? selectedReels : reels.slice(0, 3);

    return activeReels.map((reel, index) => ({
      ...cardCopy[index],
      ...reel,
    }));
  }, [selectedReels]);

  return (
    <section className="section social-proof-section">
      <div className="container">
        <div className="section-head social-proof-head">
          <div>
            <div className="eyebrow">Seen on Instagram</div>

            <h2 className="section-title">
              Real videos. Real reactions. Real confidence.
            </h2>

            <p className="muted social-proof-subtitle">
              Watch how House of Eon perfumes look, feel and fit into everyday
              style — from office confidence to evening presence.
            </p>
          </div>

          <a
            href={reelsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            View all reels →
          </a>
        </div>

        <div className="social-proof-grid">
          {reelsToShow.map((card, index) => (
            <a
              key={`${card.url}-${index}`}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-proof-card"
              aria-label={`Watch House of Eon reel: ${card.title}`}
            >
              <div
                className={`social-video-frame social-video-frame-${
                  index + 1
                } has-reel-image`}
              >
                <ReelThumbnail image={card.image} label={card.label} />

                <div className="social-reel-top">
                  <span>HOUSE OF EON</span>
                  <b>REEL</b>
                </div>

                <div className="social-play-wrap">
                  <div className="play-button">▶</div>
                  <span>Tap to watch</span>
                </div>

                <div className="social-reel-bottom">
                  <span>{card.label}</span>
                </div>
              </div>

              <span className="social-card-label">{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>

              <div className="social-card-cta">Watch reel →</div>
            </a>
          ))}
        </div>

        <div className="social-proof-cta">
          <div>
            <span>Found your vibe?</span>
            <b>Choose your House of Eon perfume now.</b>
          </div>

          <div className="product-actions">
            <Link href="/products" className="btn">
              Shop perfumes
            </Link>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary"
            >
              Follow Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}