import { useState, useEffect } from 'react';
import { API, DEFAULT_FORM_VISIBILITY } from '../api';

export function useFormVisibility() {
  const [visibility, setVisibility] = useState(() => API.getFormVisibilitySettings());

  useEffect(() => {
    // 1. Fetch latest from Supabase on mount
    API.fetchFormVisibilitySettings()
      .then(settings => {
        if (settings) setVisibility(settings);
      })
      .catch(() => {});

    // 2. React to local or cross-window visibility changes
    const handler = (e) => {
      if (e.detail) {
        setVisibility(e.detail);
      } else {
        setVisibility(API.getFormVisibilitySettings());
      }
    };

    window.addEventListener('form_visibility_changed', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('form_visibility_changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return visibility || DEFAULT_FORM_VISIBILITY;
}
