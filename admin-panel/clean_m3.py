import re

filepath = r'd:\AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line\admin-panel\src\pages\Member3Dashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove Auth Constants, AuthScreen, HistoryPanel block
code = re.sub(r'// ─── Auth Constants ───.*?(?=// ─── Main Dashboard)', '', code, flags=re.DOTALL)

# 2. Modify Member3Dashboard function definition
member3_start = """export default function Member3Dashboard() {
  const locationList = Object.keys(CLIMATE_DATA);

  const [form, setForm] = useState({ Budget_LKR: "", Roof_Size_m2: "", Location: "", Preferred_Brand: "", Energy_Usage_kWhPerDay: "" });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [apiOnline, setApiOnline] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.ok ? setApiOnline(true) : setApiOnline(false))
      .catch(() => setApiOnline(false));
  }, []);"""

code = re.sub(
    r'export default function Member3Dashboard\(\) \{.*?(?=  const handleChange = \(e\))', 
    member3_start + '\n\n', 
    code, 
    flags=re.DOTALL
)

# 3. Remove Authorization header from fetch
code = code.replace(
    '"Authorization": `Bearer ${authToken}`',
    ''
)
code = code.replace(
    'headers: { "Content-Type": "application/json",  },',
    'headers: { "Content-Type": "application/json" },'
)

# 4. Remove History component invocation
code = code.replace('{showHistory && <HistoryPanel token={authToken} onClose={() => setShowHistory(false)} />}', '')

# 5. Remove account/header controls
header_controls = """              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ padding: "5px 12px", background: "rgba(34,211,204,0.08)", border: `1px solid rgba(34,211,204,0.2)`, borderRadius: 99, fontSize: 11, color: C.teal, fontWeight: 600 }}>👤 {authEmail}</div>
                <button onClick={() => setShowHistory(true)} style={{ padding: "5px 12px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 99, fontSize: 11, color: C.accent, fontWeight: 600, cursor: "pointer" }}>📋 History</button>
                <button onClick={handleLogout} style={{ padding: "5px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 99, fontSize: 11, color: C.red, fontWeight: 600, cursor: "pointer" }}>Sign Out</button>
              </div>"""
code = code.replace(header_controls, '')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print('Done cleaning Member3Dashboard!')
