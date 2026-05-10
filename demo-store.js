(function () {
  const KEY = "vital_stream_demo_v1";

  function defaults() {
    const now = Date.now();
    return {
      donors: [
        {
          id: 1,
          name: "Sam Rivera",
          blood_type: "A+",
          phone: "555-0142",
          location: "Cairo",
          created_at: new Date(now - 86400000 * 3).toISOString(),
          latitude: 30.04,
          longitude: 31.23,
        },
        {
          id: 2,
          name: "Jordan Lee",
          blood_type: "O-",
          phone: "555-0199",
          location: "Alexandria",
          created_at: new Date(now - 86400000).toISOString(),
          latitude: null,
          longitude: null,
        },
        {
          id: 3,
          name: "Riley Chen",
          blood_type: "B+",
          phone: "555-0100",
          location: "Giza",
          created_at: new Date(now - 3600000 * 8).toISOString(),
          latitude: null,
          longitude: null,
        },
        {
          id: 4,
          name: "Taylor Brooks",
          blood_type: "AB+",
          phone: "555-0166",
          location: "New Capital",
          created_at: new Date(now - 3600000 * 2).toISOString(),
          latitude: null,
          longitude: null,
        },
      ],
      inventory_units: [
        {
          id: 1,
          blood_type: "A+",
          units: 42,
          status: "available",
          location: "City Hospital",
          distance_km: 2.4,
          updated_at: new Date(now - 3600000).toISOString(),
        },
        {
          id: 2,
          blood_type: "O-",
          units: 8,
          status: "critical",
          location: "North Emergency Hospital",
          distance_km: 4.1,
          updated_at: new Date(now - 7200000).toISOString(),
        },
        {
          id: 3,
          blood_type: "B+",
          units: 55,
          status: "available",
          location: "Central Blood Center",
          distance_km: 5.2,
          updated_at: new Date(now - 86400000).toISOString(),
        },
        {
          id: 4,
          blood_type: "AB+",
          units: 20,
          status: "available",
          location: "East Wing Lab",
          distance_km: 7.0,
          updated_at: new Date(now - 2000000).toISOString(),
        },
        {
          id: 5,
          blood_type: "O+",
          units: 33,
          status: "available",
          location: "South Regional Bank",
          distance_km: 9.3,
          updated_at: new Date(now - 5000000).toISOString(),
        },
      ],
      emergency_requests: [
        {
          id: 1,
          hospital_name: "Metro ICU | Patient: A. Doe | Units: 2",
          blood_type: "O+",
          urgency_level: "Urgent",
          status: "pending",
          created_at: new Date(now - 1800000).toISOString(),
        },
        {
          id: 2,
          hospital_name: "Children's Hospital — Ward 4",
          blood_type: "A-",
          urgency_level: "Critical",
          status: "pending",
          created_at: new Date(now - 3600000 * 6).toISOString(),
        },
        {
          id: 3,
          hospital_name: "Trauma Center North",
          blood_type: "B+",
          urgency_level: "Urgent",
          status: "dispatched",
          created_at: new Date(now - 86400000).toISOString(),
        },
      ],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const d = defaults();
    localStorage.setItem(KEY, JSON.stringify(d));
    return d;
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function reset() {
    const d = defaults();
    save(d);
    return d;
  }

  function nextId(db, table) {
    const arr = db[table] || [];
    let max = 0;
    for (let i = 0; i < arr.length; i += 1) {
      const n = Number(arr[i].id);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return max + 1;
  }

  window.VitalStreamDemo = { load, save, reset, nextId, defaults };
})();
