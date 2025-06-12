import React, { useEffect, useRef } from "react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Props {
  from: Coordinates;
  to: Coordinates;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const YandexMap: React.FC<Props> = ({ from, to }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const ymapsRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const multiRouteRef = useRef<any>(null);

  const loadYandexMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.ymaps) return resolve();

      const script = document.createElement("script");
      script.src = "https://api-maps.yandex.ru/2.1/?apikey=ef84f2a7-333d-4b33-b3d5-5263cb19fb71&lang=ru_RU";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const initMap = async () => {
    if (!window.ymaps || !mapRef.current) return;

    await window.ymaps.ready();
    ymapsRef.current = window.ymaps;

    const ymaps = ymapsRef.current;

    mapInstanceRef.current = new ymaps.Map(mapRef.current, {
      center: [from.latitude, from.longitude],
      zoom: 12,
      controls: [],
    });

    multiRouteRef.current = new ymaps.multiRouter.MultiRoute(
      {
        referencePoints: [
          [from.latitude, from.longitude],
          [to.latitude, to.longitude],
        ],
        params: { routingMode: "auto" },
      },
      { boundsAutoApply: true }
    );

    mapInstanceRef.current.geoObjects.add(multiRouteRef.current);
  };

  useEffect(() => {
    let isMounted = true;

    loadYandexMapsScript()
      .then(() => {
        if (isMounted) initMap();
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (multiRouteRef.current) {
      multiRouteRef.current.model.setReferencePoints([
        [from.latitude, from.longitude],
        [to.latitude, to.longitude],
      ]);
    }
  }, [from, to]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default YandexMap;
