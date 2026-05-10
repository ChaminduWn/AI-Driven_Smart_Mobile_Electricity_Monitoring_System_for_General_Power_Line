const defaultCertificateStatus = 'Pending';

const normalizeQualificationCertificates = (user) => {
    const rawCertificates = Array.isArray(user?.qualificationCertificates)
        ? user.qualificationCertificates
        : [];

    const normalized = rawCertificates
        .filter(Boolean)
        .map((certificate, index) => ({
            id: certificate.id || `cert-${index + 1}`,
            title: certificate.title || `Qualification Certificate ${index + 1}`,
            imageUrl: certificate.imageUrl || certificate.url || '',
            status: certificate.status || defaultCertificateStatus,
            uploadedAt: certificate.uploadedAt || user?.createdAt || new Date().toISOString(),
            reviewedAt: certificate.reviewedAt || null,
            reviewNotes: certificate.reviewNotes || '',
        }))
        .filter((certificate) => Boolean(certificate.imageUrl));

    if (user?.nvqCertificateUrl && !normalized.some((certificate) => certificate.imageUrl === user.nvqCertificateUrl)) {
        normalized.unshift({
            id: 'legacy-nvq',
            title: 'NVQ Certificate',
            imageUrl: user.nvqCertificateUrl,
            status: user?.isVerified ? 'Accepted' : defaultCertificateStatus,
            uploadedAt: user?.createdAt || new Date().toISOString(),
            reviewedAt: user?.isVerified ? user?.updatedAt || user?.createdAt || new Date().toISOString() : null,
            reviewNotes: '',
        });
    }

    return normalized;
};

const getAcceptedCertificates = (user) =>
    normalizeQualificationCertificates(user).filter((certificate) => certificate.status === 'Accepted');

const buildUserPayload = (user, extra = {}) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    address: user.address,
    district: user.district,
    role: user.role,
    displayId: user.displayId,
    isVerified: user.isVerified,
    isAvailable: user.isAvailable,
    rating: user.rating,
    vehicleNumber: user.vehicleNumber,
    nvqCertificateUrl: user.nvqCertificateUrl,
    qualificationCertificates: normalizeQualificationCertificates(user),
    acceptedCertificates: getAcceptedCertificates(user),
    cashCollected: user.cashCollected,
    digitalBalance: user.digitalBalance,
    commissionOwed: user.commissionOwed,
    ...extra,
});

module.exports = {
    buildUserPayload,
    getAcceptedCertificates,
    normalizeQualificationCertificates,
};
