import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Navigation, RefreshCw, CheckCircle2, AlertCircle, Trash2, ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react';
import { API } from '../api';

export default function GeoPhotoCapture({
  photoUrl = '',
  latitude = '',
  longitude = '',
  geoAccuracy = '',
  onChange,
  panchayat = '',
  officerName = '',
  categoryLabel = 'क्षेत्रीय निरीक्षण',
  themeColor = 'blue' // 'pink' | 'blue' | 'emerald' | 'amber' | 'purple' | 'red' | 'cyan'
}) {
  const [currentLat, setCurrentLat] = useState(latitude || '');
  const [currentLng, setCurrentLng] = useState(longitude || '');
  const [currentAcc, setCurrentAcc] = useState(geoAccuracy || '');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showManualGps, setShowManualGps] = useState(false);

  const fileInputRef = useRef(null);

  // Synchronize incoming props
  useEffect(() => {
    if (latitude) setCurrentLat(latitude);
    if (longitude) setCurrentLng(longitude);
    if (geoAccuracy) setCurrentAcc(geoAccuracy);
  }, [latitude, longitude, geoAccuracy]);

  // Request GPS on mount if not already present
  useEffect(() => {
    if (!currentLat || !currentLng) {
      acquireLocation();
    }
  }, []);

  const acquireLocation = (onComplete) => {
    if (!navigator.geolocation) {
      setGpsError('इस ब्राउज़र में जीपीएस लोकेशन सुविधा उपलब्ध नहीं है।');
      if (onComplete) onComplete(null);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const acc = Math.round(pos.coords.accuracy);

        setCurrentLat(lat);
        setCurrentLng(lng);
        setCurrentAcc(acc);
        setGpsLoading(false);

        if (onChange && !photoUrl) {
          onChange({
            photoUrl: photoUrl || '',
            latitude: lat,
            longitude: lng,
            geoAccuracy: acc
          });
        }

        if (onComplete) onComplete({ lat, lng, acc });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        let msg = 'जीपीएस लोकेशन प्राप्त नहीं हो सकी।';
        if (err.code === 1) {
          msg = 'कृपया ब्राउज़र में लोकेशन की अनुमति (Location Permission) Allow करें।';
        } else if (err.code === 2) {
          msg = 'मोबाइल में जीपीएस / लोकेशन ऑन करें।';
        } else if (err.code === 3) {
          msg = 'लोकेशन खोजने का समय समाप्त हुआ। कृपया पुनः प्रयास करें।';
        }
        setGpsError(msg);
        setGpsLoading(false);
        if (onComplete) onComplete(null);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  };

  // Watermark canvas overlay onto the image
  const watermarkImage = (img, lat, lng, acc) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Scale to max width 1280px for optimal performance and quality
      const maxDim = 1280;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      // Bottom banner dimensions
      const bannerHeight = Math.max(100, Math.round(height * 0.18));
      const bannerY = height - bannerHeight;

      // Draw semi-transparent dark banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(0, bannerY, width, bannerHeight);

      // Gold top accent border
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, bannerY, width, Math.max(4, Math.round(height * 0.006)));

      // Watermark Text Configuration
      ctx.fillStyle = '#ffffff';
      const fontSize = Math.max(14, Math.round(width * 0.024));
      ctx.font = `bold ${fontSize}px sans-serif`;

      const paddingLeft = Math.round(width * 0.03);
      const lineHeight = fontSize * 1.35;
      let textY = bannerY + (fontSize * 1.4);

      // Line 1: GPS Coordinates
      const gpsText = (lat && lng)
        ? `📍 अक्षांश (Lat): ${lat}° N | देशांतर (Long): ${lng}° E ${acc ? `(±${acc}m)` : ''}`
        : '📍 जीपीएस लोकेशन: अनिर्धारित';
      ctx.fillStyle = '#fef08a'; // light yellow for coordinates
      ctx.fillText(gpsText, paddingLeft, textY);

      // Line 2: Date & Time
      textY += lineHeight;
      const nowStr = new Date().toLocaleString('hi-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
      ctx.fillStyle = '#ffffff';
      ctx.font = `${fontSize * 0.9}px sans-serif`;
      ctx.fillText(`📅 दिनांक व समय: ${nowStr} • ${categoryLabel}`, paddingLeft, textY);

      // Line 3: Panchayat & Inspector Name
      textY += lineHeight;
      const detailsText = `🏛️ ग्राम पंचायत: ${panchayat || 'कोण्डागांव'} • 👮 निरीक्षणकर्ता: ${officerName || 'नोडल अधिकारी'}`;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(detailsText, paddingLeft, textY);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.88
      );
    });
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // If coordinates not ready yet, try quick fetch
    let latToUse = currentLat;
    let lngToUse = currentLng;
    let accToUse = currentAcc;

    if (!latToUse || !lngToUse) {
      await new Promise((res) => {
        acquireLocation((coords) => {
          if (coords) {
            latToUse = coords.lat;
            lngToUse = coords.lng;
            accToUse = coords.acc;
          }
          res();
        });
      });
    }

    try {
      // Load file into image
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = async () => {
          try {
            // Apply GPS watermark
            const watermarkedBlob = await watermarkImage(img, latToUse, lngToUse, accToUse);
            const watermarkedFile = new File(
              [watermarkedBlob],
              `geo_inspect_${Date.now()}.jpg`,
              { type: 'image/jpeg' }
            );

            // Upload via API
            const res = await API.uploadFile(watermarkedFile);
            const newPhotoUrl = res.fileUrl || res.dataUrl;

            if (onChange) {
              onChange({
                photoUrl: newPhotoUrl,
                latitude: latToUse,
                longitude: lngToUse,
                geoAccuracy: accToUse
              });
            }
          } catch (uploadErr) {
            console.error('Failed to watermark/upload:', uploadErr);
            alert('फोटो प्रोसेस करने में त्रुटि हुई।');
          } finally {
            setUploading(false);
          }
        };
        img.src = readerEvent.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    if (confirm('क्या आप इस फोटो को हटाना चाहते हैं?')) {
      if (onChange) {
        onChange({
          photoUrl: '',
          latitude: currentLat,
          longitude: currentLng,
          geoAccuracy: currentAcc
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualGpsSave = () => {
    if (onChange) {
      onChange({
        photoUrl: photoUrl || '',
        latitude: currentLat,
        longitude: currentLng,
        geoAccuracy: currentAcc || '10'
      });
    }
    setShowManualGps(false);
  };

  const colorClasses = {
    pink: 'text-pink-600 bg-pink-50 border-pink-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  }[themeColor] || 'text-blue-600 bg-blue-50 border-blue-200';

  const buttonColorClasses = {
    pink: 'bg-pink-700 hover:bg-pink-800 text-white',
    blue: 'bg-blue-700 hover:bg-blue-800 text-white',
    emerald: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    amber: 'bg-amber-700 hover:bg-amber-800 text-white',
    purple: 'bg-purple-700 hover:bg-purple-800 text-white',
    red: 'bg-red-700 hover:bg-red-800 text-white',
    cyan: 'bg-cyan-700 hover:bg-cyan-800 text-white',
  }[themeColor] || 'bg-blue-700 hover:bg-blue-800 text-white';

  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
      {/* Title & GPS Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-slate-700" />
          <span>निरीक्षण स्थल लाइव फोटो एवं जीपीएस निर्देशांक (Geo-Tagging)</span>
        </label>

        {/* GPS refresh / status button */}
        <div className="flex items-center gap-2">
          {gpsLoading ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              जीपीएस खोज रहे हैं...
            </span>
          ) : currentLat && currentLng ? (
            <button
              type="button"
              onClick={() => acquireLocation()}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-md transition"
              title="जीपीएस निर्देशांक ताज़ा करें"
            >
              <RefreshCw className="w-3 h-3" />
              <span>जीपीएस रिफ्रेश करें</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => acquireLocation()}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-md transition"
            >
              <Navigation className="w-3 h-3" />
              <span>जीपीएस प्राप्त करें</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowManualGps(!showManualGps)}
            className="text-[10px] text-slate-500 hover:text-slate-800 underline"
          >
            {showManualGps ? 'छुपाएं' : 'मैन्युअल'}
          </button>
        </div>
      </div>

      {/* GPS Coordinate Display Card */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs shadow-2xs space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>जीपीएस निर्देशांक:</span>
            </span>

            {currentLat && currentLng ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Lat: {currentLat}° N, Long: {currentLng}° E
                {currentAcc && <span className="text-[10px] font-normal text-emerald-700">(±{currentAcc} मी.)</span>}
              </span>
            ) : (
              <span className="text-amber-700 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {gpsError || 'लोकेशन खोजी जा रही है (कृपया अनुमति दें)...'}
              </span>
            )}
          </div>

          {currentLat && currentLng && (
            <a
              href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>गूगल मैप्स पर देखें</span>
            </a>
          )}
        </div>

        {/* Manual coordinates input toggle */}
        {showManualGps && (
          <div className="pt-2 mt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">अक्षांश (Latitude):</label>
              <input
                type="text"
                value={currentLat}
                onChange={e => setCurrentLat(e.target.value)}
                placeholder="उदा. 19.598214"
                className="w-full text-xs p-1.5 border rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">देशांतर (Longitude):</label>
              <input
                type="text"
                value={currentLng}
                onChange={e => setCurrentLng(e.target.value)}
                placeholder="उदा. 81.672345"
                className="w-full text-xs p-1.5 border rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleManualGpsSave}
                className="w-full text-xs font-bold py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition"
              >
                निर्देशांक सुरक्षित करें
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Photo Capture Actions & Preview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {!photoUrl ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition ${buttonColorClasses}`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>फोटो जियो-टैग व अपलोड हो रही है...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>📷 फोटो खींचें / अपलोड करें (Geo-Tagged Photo)</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>फोटो बदलें</span>
            </button>

            <button
              type="button"
              onClick={handleRemovePhoto}
              className="py-2 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>हटाएं</span>
            </button>
          </div>
        )}

        <span className="text-[11px] text-slate-500">
          * कैमरे से फोटो खींचते ही अक्षांश, देशांतर, दिनांक व समय फोटो पर स्वतः वॉटरमार्क हो जाएंगे।
        </span>
      </div>

      {/* Photo Preview with Geotag Badges */}
      {photoUrl && (
        <div className="relative inline-block border-2 border-slate-300 rounded-2xl overflow-hidden shadow-md bg-black">
          <img
            src={photoUrl}
            alt="Geo-Tagged Inspection Site"
            className="max-h-64 sm:max-h-72 w-auto object-contain rounded-xl"
          />
          <div className="absolute top-2 left-2 bg-black/75 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-400/50 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            <span>Geo-Tagged Photo</span>
          </div>
        </div>
      )}
    </div>
  );
}
