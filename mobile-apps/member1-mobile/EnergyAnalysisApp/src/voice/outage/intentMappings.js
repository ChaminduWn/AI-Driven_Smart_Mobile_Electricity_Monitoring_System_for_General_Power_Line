export const HOUSEHOLDER_HOME_INTENTS = [
    'open_report_to_electricity_board',
    'open_power_supply_issues',
    'open_voltage_technical_issues',
    'open_safety_related_issues',
    'open_infrastructure_issues',
    'open_monitoring_device_issues',
    'open_activities',
    'view_activities',
    'open_account',
    'open_profile_settings',
    'open_help_support',
    'open_about_us',
    'change_language',
    'go_home',
];

export const BOARD_REPORT_INTENTS = [
    'select_transformer_issues',
    'select_power_line_faults',
    'select_weather_related_damage',
    'select_pole_issues',
    'select_short_circuit_or_fire',
    'select_area_power_failure',
    'select_substation_issues',
    'select_meter_or_service_line_issues',
    'select_external_or_human_causes',
    'select_unknown_investigation_required',
    'add_photo',
    'continue_next',
    'continue_to_location',
    'go_back',
];

export const SERVICE_SUBCATEGORY_INTENTS = [
    'select_complete_power_outage',
    'select_partial_power_outage',
    'select_intermittent_supply',
    'select_scheduled_power_cut',
    'select_sudden_power_loss',
    'select_low_voltage',
    'select_high_voltage',
    'select_fluctuating_voltage',
    'select_dim_lights',
    'select_sparks_from_meter',
    'select_burning_smell',
    'select_exposed_wiring',
    'select_electric_shock_risk',
    'select_damaged_power_lines',
    'select_fallen_pole',
    'select_broken_meter_box',
    'select_faulty_meter_reading',
    'select_smart_meter_issue',
    'select_device_connectivity',
    'add_photo',
    'continue_to_location',
    'go_back',
];

export const LOCATION_INTENTS = [
    'use_current_location',
    'search_location',
    'review_and_confirm_issue',
    'confirm_location_and_report_issue',
    'confirm_location_technician',
    'find_available_technicians',
    'go_back',
];

export const ELECTRICIAN_HOME_INTENTS = [
    'open_jobs',
    'open_history',
    'open_earnings',
    'open_account',
    'open_profile_settings',
    'open_help_support',
    'open_about_us',
    'open_service_setup',
    'view_job_details',
    'accept_job',
    'change_language',
    'go_home',
];

export const TRACK_TECHNICIAN_INTENTS = [
    'open_chat',
    'track_technician',
    'make_payment',
    'rate_technician',
    'cancel_request',
];

export const DASHBOARD_CATEGORY_BY_INTENT = {
    open_power_supply_issues: 'power',
    open_voltage_technical_issues: 'voltage',
    open_safety_related_issues: 'safety',
    open_infrastructure_issues: 'infrastructure',
    open_monitoring_device_issues: 'monitoring',
};

export const BOARD_CATEGORY_BY_INTENT = {
    select_transformer_issues: 'transformer',
    select_power_line_faults: 'power-lines',
    select_weather_related_damage: 'weather-damage',
    select_pole_issues: 'pole-issues',
    select_short_circuit_or_fire: 'short-circuit-fire',
    select_area_power_failure: 'area-power-failure',
    select_substation_issues: 'substation',
    select_meter_or_service_line_issues: 'meter-service-line',
    select_external_or_human_causes: 'external-causes',
    select_unknown_investigation_required: 'unknown',
};

export const SERVICE_ID_BY_INTENT = {
    select_complete_power_outage: 'M2-POW-001',
    select_partial_power_outage: 'M2-POW-002',
    select_intermittent_supply: 'M2-POW-003',
    select_scheduled_power_cut: 'M2-POW-004',
    select_sudden_power_loss: 'M2-POW-005',
    select_low_voltage: 'M2-VOL-001',
    select_high_voltage: 'M2-VOL-002',
    select_fluctuating_voltage: 'M2-VOL-003',
    select_dim_lights: 'M2-VOL-004',
    select_sparks_from_meter: 'M2-SAF-001',
    select_burning_smell: 'M2-SAF-002',
    select_exposed_wiring: 'M2-SAF-003',
    select_electric_shock_risk: 'M2-SAF-004',
    select_damaged_power_lines: 'M2-INF-001',
    select_fallen_pole: 'M2-INF-002',
    select_broken_meter_box: 'M2-INF-003',
    select_faulty_meter_reading: 'M2-MON-001',
    select_smart_meter_issue: 'M2-MON-002',
    select_device_connectivity: 'M2-MON-003',
};

const VOICE_INTENT_ALIASES = {
    open_report_to_electricity_board: [
        'report electricity board',
        'select report electricity board',
        'open report electricity board',
        'go to report electricity board',
        'report to electricity board',
        'board issue report',
        'open board issue report',
        'electricity board report',
        'select report to electricity board',
        'viduli mandalayata report karanna',
        'viduli mandalayata report karanna thoranna',
        'viduli mandalayata report karanna open karanna',
        'ප්‍රදේශීය විදුලි බිඳවැටීම් වාර්තා කිරීම',
        'විදුලි මණ්ඩලයට වාර්තා කරන්න',
        'විදුලි මණ්ඩල වාර්තාව',
        'විදුලි මණ්ඩලයට වාර්තා කරන්න තෝරන්න',
    ],
    open_power_supply_issues: [
        'power supply issues',
        'select power supply issues',
        'open power supply issues',
        'go to power supply issues',
        'supply problems',
        'current issues',
        'widuli sapayum getalu',
        'widuli sapayum getalu thoranna',
        'widuli sapayum getalu open karanna',
        'widuli sapayum getalu pennanna',
        'widuli sapayum getalu wetha yanna',
        'විදුලි සැපයුම් ගැටළු',
        'විදුලි සැපයුම් දෝෂ',
        'විදුලි සැපයුම් ගැටළු තෝරන්න',
        'විදුලි සැපයුම් ගැටළු වෙත යන්න',
    ],
    open_voltage_technical_issues: [
        'voltage technical issues',
        'select voltage technical issues',
        'open voltage technical issues',
        'go to voltage technical issues',
        'voltage issues',
        'voltage getalu',
        'වෝල්ටීයතා සහ තාක්ෂණික ගැටළු',
        'වෝල්ටීයතා ගැටළු',
        'වෝල්ටීයතා ගැටළු තෝරන්න',
    ],
    open_safety_related_issues: [
        'safety related issues',
        'select safety related issues',
        'open safety related issues',
        'go to safety related issues',
        'safety issues',
        'arakshawa sambandha getalu',
        'ආරක්ෂාව සම්බන්ධ ගැටළු',
        'ආරක්ෂක ගැටළු',
        'ආරක්ෂාව සම්බන්ධ ගැටළු තෝරන්න',
    ],
    open_infrastructure_issues: [
        'infrastructure issues',
        'select infrastructure issues',
        'open infrastructure issues',
        'go to infrastructure issues',
        'infrastructure issues thoranna',
        'yatithala pahasukam getalu',
        'යටිතල පහසුකම් ගැටළු',
        'යටිතල පහසුකම් ගැටළු තෝරන්න',
        'යටිතල ගැටළු',
    ],
    open_monitoring_device_issues: [
        'monitoring device issues',
        'select monitoring device issues',
        'open monitoring device issues',
        'go to monitoring device issues',
        'monitoring issues',
        'device monitoring issues',
        'adhikshana saha upanga getalu',
        'අධීක්ෂණ සහ උපකරණ ගැටළු',
        'උපකරණ ගැටළු',
        'උපකරණ සම්බන්ධතා ගැටළු',
    ],
    open_activities: ['activities', 'open activities', 'go to activities', 'kriyakarakam', 'ක්‍රියාකාරකම්', 'ක්‍රියාකාරකම් බලන්න'],
    view_activities: ['view activities', 'show activities', 'activities pennanna', 'ක්‍රියාකාරකම් පෙන්වන්න'],
    open_account: ['account', 'open account', 'go to account', 'ginuma', 'ගිණුම', 'ගිණුම විවෘත කරන්න'],
    open_profile_settings: ['profile settings', 'open profile settings', 'go to profile settings', 'profile settings thoranna', 'profile settings', 'පැතිකඩ සැකසුම්'],
    open_help_support: ['help support', 'open help support', 'go to help support', 'help', 'udaw saha sahaya', 'උදව් සහ සහාය'],
    open_about_us: ['about us', 'open about us', 'go to about us', 'api gena', 'අප ගැන'],
    change_language: ['change language', 'switch language', 'basha wenas karanna', 'භාෂාව වෙනස් කරන්න'],
    go_home: ['go home', 'home page', 'dashboard', 'gedara yanna', 'මුල් පිටුවට යන්න', 'ඩැෂ්බෝඩ්'],
    go_back: ['go back', 'back', 'previous page', 'passe yanna', 'ආපසු යන්න'],
    add_photo: ['add photo', 'upload photo', 'attach photo', 'photo ekak ek karanna', 'ඡායාරූපයක් එක් කරන්න'],
    continue_next: ['continue', 'next', 'idiriyata yanna', 'ඉදිරියට යන්න'],
    continue_to_location: [
        'continue to location',
        'next to location',
        'go to location',
        'location ekata yanna',
        'location page ekata yanna',
        'set location next',
        'open location screen',
        'ස්ථානය වෙත යන්න',
        'ස්ථානය සැකසීමට යන්න',
        'ගැටලුවේ ස්ථානය සකසන්න',
    ],
    use_current_location: [
        'use current location',
        'current location',
        'my current location',
        'wathman sthanaya bhawitha karanna',
        'වත්මන් ස්ථානය භාවිතා කරන්න',
    ],
    search_location: ['search location', 'find location', 'search place', 'location hoyanna', 'ස්ථානය සොයන්න'],
    review_and_confirm_issue: ['review and confirm issue', 'review issue', 'confirm issue'],
    confirm_location_and_report_issue: [
        'confirm location and report issue',
        'report issue now',
        'sthaanaya thahawuru karala report karanna',
        'ස්ථානය තහවුරු කර ගැටලුව වාර්තා කරන්න',
    ],
    confirm_location_technician: ['confirm location technician', 'confirm technician location', 'technician location confirm karanna', 'ස්ථානය තහවුරු කරන්න'],
    find_available_technicians: ['find available technicians', 'find technician', 'show technicians', 'available technicians hoyanna', 'තාක්ෂණ ශිල්පීන් සොයන්න'],
    open_jobs: ['jobs', 'open jobs', 'go to jobs', 'jobs balanna', 'රැකියා බලන්න'],
    open_history: ['history', 'open history', 'go to history', 'ithihasaya', 'ඉතිහාසය'],
    open_earnings: ['earnings', 'open earnings', 'go to earnings', 'adayama', 'ආදායම'],
    open_service_setup: ['service setup', 'open service setup', 'go to service setup', 'sewa sakasuma', 'සේවා සැකසුම'],
    view_job_details: ['job details', 'view job details', 'show job details', 'job details pennanna', 'රැකියා විස්තර'],
    accept_job: ['accept job', 'take job', 'job eka bara ganna', 'රැකියාව භාර ගන්න'],
    open_chat: ['chat', 'open chat', 'go to chat'],
    track_technician: ['track technician', 'track electrician'],
    make_payment: ['make payment', 'pay now'],
    rate_technician: ['rate technician', 'give rating'],
    cancel_request: ['cancel request', 'cancel job'],
    select_transformer_issues: ['select transformer issues', 'transformer issues', 'transformer getalu', 'ට්‍රාන්ස්ෆෝමර් ගැටළු', 'ට්‍රාන්ස්ෆෝමර් පිපිරීම'],
    select_power_line_faults: ['select power line faults', 'power line faults', 'power line dosha', 'විදුලි රේඛා දෝෂ'],
    select_weather_related_damage: ['select weather related damage', 'weather related damage', 'kalagunayen wi haani', 'කාලගුණයෙන් වූ හානි'],
    select_pole_issues: ['select pole issues', 'pole issues', 'kanu getalu', 'කණු ගැටළු'],
    select_short_circuit_or_fire: ['select short circuit or fire', 'short circuit or fire', 'keti wataya ho gini', 'කෙටි වටය හෝ ගිනි'],
    select_area_power_failure: ['select area power failure', 'area power failure', 'pradeshiya widuli bindawateem', 'ප්‍රදේශීය විදුලි බිඳවැටීම'],
    select_substation_issues: ['select substation issues', 'substation issues', 'upasthana getalu', 'උපස්ථාන ගැටළු'],
    select_meter_or_service_line_issues: ['select meter or service line issues', 'meter service line issues', 'meter sewa rekha getalu', 'මීටර හෝ සේවා රේඛා ගැටළු'],
    select_external_or_human_causes: ['select external or human causes', 'external causes', 'bahira ho minis karana', 'බාහිර හෝ මිනිස් කාරණා'],
    select_unknown_investigation_required: ['select unknown investigation required', 'unknown issue', 'aparahadili getalu', 'අපැහැදිලි හෝ පරීක්ෂණය අවශ්‍ය'],
    select_complete_power_outage: ['select complete power outage', 'complete power outage', 'sampurna widuliya visandi weema', 'සම්පූර්ණ විදුලිය විසන්ධි වීම'],
    select_partial_power_outage: ['select partial power outage', 'partial power outage', 'ardha widuliya visandi weema', 'අර්ධ විදුලිය විසන්ධි වීම'],
    select_intermittent_supply: ['select intermittent supply', 'intermittent supply', 'sthapitha nowana sepayuma', 'ස්ථාපිත නොවන සැපයුම'],
    select_scheduled_power_cut: ['select scheduled power cut', 'scheduled power cut', 'selasum kala widuli kappaduwa', 'සැලසුම් කළ විදුලි කප්පාදුව'],
    select_sudden_power_loss: ['select sudden power loss', 'sudden power loss', 'hadisi widuli bindawateema', 'හදිසි විදුලි බිඳවැටීම'],
    select_low_voltage: ['select low voltage', 'low voltage', 'adu voltage', 'අඩු වෝල්ටීයතාවය'],
    select_high_voltage: ['select high voltage', 'high voltage', 'wadi voltage', 'අධි වෝල්ටීයතාවය'],
    select_fluctuating_voltage: ['select fluctuating voltage', 'fluctuating voltage', 'asthawara voltage', 'අස්ථාවර වෝල්ටීයතාවය'],
    select_dim_lights: ['select dim lights', 'dim lights', 'anduru bulb', 'අඳුරු විදුලි බුබුළු'],
    select_sparks_from_meter: ['select sparks from meter', 'sparks from meter', 'meteren pupuru gaseema', 'මීටරයෙන් පුපුරු ගැසීම'],
    select_burning_smell: ['select burning smell', 'burning smell', 'pilissena suwada', 'පිළිස්සෙන සුවඳ'],
    select_exposed_wiring: ['select exposed wiring', 'exposed wiring', 'niraawaranaya wu wire', 'නිරාවරණය වූ වයර්'],
    select_electric_shock_risk: ['select electric shock risk', 'electric shock risk', 'electric shock awadanama', 'විදුලිය වැදීමේ අවදානම'],
    select_damaged_power_lines: ['select damaged power lines', 'damaged power lines', 'haani wu widuli rahen', 'හානි වූ විදුලි රැහැන්'],
    select_fallen_pole: ['select fallen pole', 'fallen pole', 'kada wetunu kanuwa', 'කඩා වැටුණු කණුව'],
    select_broken_meter_box: ['select broken meter box', 'broken meter box', 'kedunu meter pettiya', 'කැඩුණු මීටර් පෙට්ටිය'],
    select_faulty_meter_reading: ['select faulty meter reading', 'faulty meter reading', 'dosha sahitha meter kiyawima', 'දෝෂ සහිත මීටර කියවීම'],
    select_smart_meter_issue: ['select smart meter issue', 'smart meter issue', 'smart meter doshaya', 'ස්මාර්ට් මීටර දෝෂය'],
    select_device_connectivity: ['select device connectivity', 'device connectivity', 'device sambandatha getalu', 'උපාංග සම්බන්ධතා ගැටළුව'],
};

export const normalizeVoiceTranscript = (value = '') =>
    String(value || '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

export const resolveLocalVoiceIntent = (transcript = '', allowedIntents = []) => {
    const normalizedTranscript = normalizeVoiceTranscript(transcript);
    if (!normalizedTranscript) {
        return null;
    }

    const allowedSet = Array.isArray(allowedIntents) && allowedIntents.length > 0
        ? new Set(allowedIntents)
        : null;

    const candidates = Object.entries(VOICE_INTENT_ALIASES)
        .filter(([intent]) => !allowedSet || allowedSet.has(intent))
        .flatMap(([intent, aliases]) =>
            aliases.map((alias) => ({
                intent,
                alias: normalizeVoiceTranscript(alias),
            }))
        )
        .sort((left, right) => right.alias.length - left.alias.length);

    const exactMatch = candidates.find(({ alias }) => alias === normalizedTranscript);
    if (exactMatch) {
        return exactMatch.intent;
    }

    const containsMatch = candidates.find(({ alias }) =>
        normalizedTranscript.includes(alias) || alias.includes(normalizedTranscript)
    );

    return containsMatch?.intent || null;
};

export const extractLocationSearchQuery = (transcript = '') => {
    const normalized = String(transcript || '').trim();
    const stripped = normalized.replace(
        /^(search|find|locate|show|go to|set|pin|find me|search for|locate|address|place|search location|find location)\s+/i,
        ''
    ).trim();

    return stripped || normalized;
};
