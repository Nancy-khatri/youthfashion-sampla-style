import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';

// OpenStreetMap pin picker. Leaflet is loaded only in the browser. Optional for checkout.
export function MapPicker({ value, onChange }: { value: { lat: number; lng: number } | null; onChange: (v: { lat: number; lng: number }) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const api = useRef<{ setPin: (lat: number, lng: number) => void } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let map: import('leaflet').Map | undefined;
    import('leaflet').then(L => {
      if (!el.current) return;
      const start = value ?? { lat: 28.8143, lng: 76.7726 }; // Sampla, Haryana
      map = L.map(el.current).setView([start.lat, start.lng], value ? 16 : 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
      const icon = L.divIcon({ className: '', html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#111;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 1px 4px #0006"></div>', iconSize: [22, 22], iconAnchor: [11, 22] });
      const marker = L.marker([start.lat, start.lng], { draggable: true, icon }).addTo(map);
      const emit = () => { const p = marker.getLatLng(); onChange({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) }); };
      marker.on('dragend', emit);
      map.on('click', e => { marker.setLatLng(e.latlng); emit(); });
      api.current = { setPin: (lat, lng) => { marker.setLatLng([lat, lng]); map?.setView([lat, lng], 17); emit(); } };
    }).catch(() => setFailed(true));
    return () => { map?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (failed) return <p className="text-xs text-muted-foreground">Map unavailable. Your written address is enough to place the order.</p>;
  return <div>
    <div ref={el} className="w-full h-64 border z-0" aria-label="Delivery location map" />
    <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
      <span className="text-[10px] text-muted-foreground">{value ? `Pin set: ${value.lat}, ${value.lng}` : 'Tap the map or drag the pin to your door (optional).'}</span>
      <Button type="button" variant="outline" size="sm" onClick={() => navigator.geolocation?.getCurrentPosition(p => api.current?.setPin(p.coords.latitude, p.coords.longitude), () => setFailed(false))}><LocateFixed />Use my location</Button>
    </div>
  </div>;
}
