const { Op } = require('sequelize');
const Job = require('../models/Job');
const User = require('../models/User');
const { getAcceptedCertificates } = require('../utils/userPayload');

const ACTIVE_JOB_STATUSES = ['Pending', 'Accepted', 'InProgress', 'PaymentPending', 'AwaitingTechnicianConfirmation'];
const ELECTRICIAN_ACTIVE_JOB_STATUSES = ['Accepted', 'InProgress', 'PaymentPending', 'AwaitingTechnicianConfirmation'];
const ELECTRICIAN_SEARCH_RADIUS_KM = 40;

const generateStartCode = () => Math.floor(1000 + Math.random() * 9000).toString();

const toNumberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const values = [lat1, lng1, lat2, lng2].map(Number);
    if (values.some((value) => !Number.isFinite(value))) {
        return null;
    }

    const [aLat, aLng, bLat, bLng] = values;
    const earthRadiusKm = 6371;
    const dLat = ((bLat - aLat) * Math.PI) / 180;
    const dLng = ((bLng - aLng) * Math.PI) / 180;

    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);

    const haversine =
        sinLat * sinLat +
        Math.cos((aLat * Math.PI) / 180) *
            Math.cos((bLat * Math.PI) / 180) *
            sinLng *
            sinLng;

    const angle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    return Number((earthRadiusKm * angle).toFixed(2));
};

const estimateTravelMinutes = (distanceKm) => {
    if (!Number.isFinite(distanceKm)) {
        return null;
    }

    const cityAverageSpeedKmH = 28;
    return Math.max(4, Math.round((distanceKm / cityAverageSpeedKmH) * 60));
};

const applyCashEarningsToElectrician = async (electricianId, resolvedAmount) => {
    if (!electricianId) {
        return;
    }

    const electrician = await User.findByPk(electricianId);
    if (!electrician) {
        return;
    }

    const commission = Number((resolvedAmount * 0.1).toFixed(2));
    electrician.cashCollected = Number((Number(electrician.cashCollected || 0) + resolvedAmount).toFixed(2));
    electrician.commissionOwed = Number((Number(electrician.commissionOwed || 0) + commission).toFixed(2));
    await electrician.save();
};

const applyDigitalEarningsToElectrician = async (electricianId, resolvedAmount) => {
    if (!electricianId) {
        return;
    }

    const electrician = await User.findByPk(electricianId);
    if (!electrician) {
        return;
    }

    const commission = Number((resolvedAmount * 0.1).toFixed(2));
    electrician.digitalBalance = Number((Number(electrician.digitalBalance || 0) + (resolvedAmount - commission)).toFixed(2));
    await electrician.save();
};

const buildUserMap = (users = []) =>
    users.reduce((acc, user) => {
        acc[user.id] = user.toJSON ? user.toJSON() : user;
        return acc;
    }, {});

const serializeJob = (job, userMap = {}, viewerLocation = null) => {
    const jobData = job.toJSON ? job.toJSON() : job;
    const householder = userMap[jobData.householderId] || null;
    const electrician = userMap[jobData.electricianId] || null;

    const liveDistanceKm =
        viewerLocation?.latitude !== undefined && viewerLocation?.longitude !== undefined
            ? calculateDistanceKm(
                  viewerLocation.latitude,
                  viewerLocation.longitude,
                  jobData.locationLat,
                  jobData.locationLng
              )
            : null;

    const travelDistanceKm =
        liveDistanceKm ?? (jobData.electricianTravelDistanceKm !== null && jobData.electricianTravelDistanceKm !== undefined
            ? Number(jobData.electricianTravelDistanceKm)
            : null);

    const travelDurationMinutes =
        liveDistanceKm !== null
            ? estimateTravelMinutes(liveDistanceKm)
            : jobData.electricianTravelDurationMinutes ?? null;

    return {
        ...jobData,
        distanceKm: travelDistanceKm,
        etaMinutes: travelDurationMinutes,
        householder: householder
            ? {
                  id: householder.id,
                  firstName: householder.firstName,
                  lastName: householder.lastName,
                  fullName: `${householder.firstName || ''} ${householder.lastName || ''}`.trim(),
                  phone: householder.phone,
                  district: householder.district,
                  address: householder.address,
              }
            : null,
        electrician: electrician
            ? {
                  id: electrician.id,
                  firstName: electrician.firstName,
                  lastName: electrician.lastName,
                  fullName: `${electrician.firstName || ''} ${electrician.lastName || ''}`.trim(),
                  phone: electrician.phone,
                  rating: electrician.rating,
                  vehicleNumber: electrician.vehicleNumber,
                  district: electrician.district,
                  acceptedCertificates: getAcceptedCertificates(electrician),
              }
            : null,
    };
};

const loadUsersForJobs = async (jobs) => {
    const userIds = [
        ...new Set(
            jobs
                .flatMap((job) => [job.householderId, job.electricianId])
                .filter(Boolean)
        ),
    ];

    if (!userIds.length) {
        return {};
    }

    const users = await User.findAll({
        where: { id: userIds },
        attributes: [
            'id',
            'firstName',
            'lastName',
            'phone',
            'district',
            'address',
            'rating',
            'vehicleNumber',
            'nvqCertificateUrl',
            'qualificationCertificates',
            'isVerified',
        ],
    });

    return buildUserMap(users);
};

const refreshElectricianRating = async (electricianId) => {
    if (!electricianId) {
        return null;
    }

    const ratedJobs = await Job.findAll({
        where: {
            electricianId,
            householderRating: {
                [Op.ne]: null,
            },
        },
        attributes: ['householderRating'],
    });

    const electrician = await User.findByPk(electricianId);
    if (!electrician) {
        return null;
    }

    if (!ratedJobs.length) {
        electrician.rating = 0;
        await electrician.save();
        return electrician.rating;
    }

    const averageRating =
        ratedJobs.reduce((sum, item) => sum + Number(item.householderRating || 0), 0) / ratedJobs.length;

    electrician.rating = Number(averageRating.toFixed(1));
    await electrician.save();
    return electrician.rating;
};

exports.createJob = async (req, res) => {
    try {
        const {
            householderId,
            title,
            description,
            issueAddress,
            locationLat,
            locationLng,
            district,
            category,
            subCategory,
            issuePhotos,
            serviceId,
            serviceName,
            serviceAmount,
        } = req.body;

        if (!householderId || !title || !description || locationLat === undefined || locationLng === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required job fields.' });
        }

        const job = await Job.create({
            householderId,
            title,
            serviceId: serviceId || null,
            serviceName: serviceName || subCategory || title,
            description,
            issueAddress: issueAddress || null,
            locationLat,
            locationLng,
            district,
            category,
            subCategory,
            issuePhotos: issuePhotos || [],
            estimatedCost: serviceAmount || null,
        });

        const usersById = await loadUsersForJobs([job]);

        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            job: serializeJob(job, usersById),
        });
    } catch (error) {
        console.error('Create Job Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.getJobsForElectrician = async (req, res) => {
    try {
        const { electricianId, district, latitude, longitude } = req.query;
        const electrician = electricianId
            ? await User.findOne({ where: { id: electricianId, role: 'Electrician' } })
            : null;

        if (electrician && (!electrician.isVerified || !electrician.isAvailable)) {
            return res.status(200).json({
                success: true,
                jobs: [],
                message: electrician.isVerified
                    ? 'Technician availability is currently turned off.'
                    : 'Technician account is still pending verification.',
            });
        }

        const activeDistrict = district || electrician?.district;
        const viewerLocation = {
            latitude: toNumberOrNull(latitude),
            longitude: toNumberOrNull(longitude),
        };
        const hasViewerLocation =
            Number.isFinite(viewerLocation.latitude) && Number.isFinite(viewerLocation.longitude);

        const jobs = await Job.findAll({
            where: {
                status: 'Pending',
            },
            order: [['createdAt', 'DESC']],
        });

        const usersById = await loadUsersForJobs(jobs);
        let data = jobs
            .map((job) => serializeJob(job, usersById, viewerLocation))
            .filter((job) => {
                if (hasViewerLocation && Number.isFinite(job.distanceKm)) {
                    return job.distanceKm <= ELECTRICIAN_SEARCH_RADIUS_KM;
                }

                if (activeDistrict) {
                    return job.district === activeDistrict;
                }

                return true;
            })
            .sort((left, right) => {
                if (left.distanceKm === null || left.distanceKm === undefined) return 1;
                if (right.distanceKm === null || right.distanceKm === undefined) return -1;
                return left.distanceKm - right.distanceKm;
            });

        res.status(200).json({ success: true, jobs: data });
    } catch (error) {
        console.error('Fetch Jobs Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.getHouseholderActiveJob = async (req, res) => {
    try {
        const { householderId } = req.params;

        const job = await Job.findOne({
            where: {
                householderId,
                status: {
                    [Op.in]: ACTIVE_JOB_STATUSES,
                },
            },
            order: [['createdAt', 'DESC']],
        });

        if (!job) {
            return res.status(200).json({ success: true, job: null });
        }

        const usersById = await loadUsersForJobs([job]);
        return res.status(200).json({ success: true, job: serializeJob(job, usersById) });
    } catch (error) {
        console.error('Fetch Active Householder Job Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.getElectricianActiveJobs = async (req, res) => {
    try {
        const { electricianId } = req.params;

        const jobs = await Job.findAll({
            where: {
                electricianId,
                status: {
                    [Op.in]: ELECTRICIAN_ACTIVE_JOB_STATUSES,
                },
            },
            order: [['acceptedAt', 'DESC'], ['updatedAt', 'DESC']],
        });

        const usersById = await loadUsersForJobs(jobs);
        return res.status(200).json({
            success: true,
            jobs: jobs.map((job) => serializeJob(job, usersById)),
        });
    } catch (error) {
        console.error('Fetch Electrician Active Jobs Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { latitude, longitude } = req.query;
        const job = await Job.findByPk(jobId);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const usersById = await loadUsersForJobs([job]);
        return res.status(200).json({
            success: true,
            job: serializeJob(job, usersById, {
                latitude: toNumberOrNull(latitude),
                longitude: toNumberOrNull(longitude),
            }),
        });
    } catch (error) {
        console.error('Fetch Job By Id Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.acceptJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { electricianId, latitude, longitude } = req.body;

        if (!electricianId) {
            return res.status(400).json({ success: false, message: 'Electrician id is required.' });
        }

        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.status !== 'Pending') {
            return res.status(409).json({ success: false, message: 'This job has already been taken.' });
        }

        const electrician = await User.findOne({
            where: {
                id: electricianId,
                role: 'Electrician',
            },
        });

        if (!electrician) {
            return res.status(404).json({ success: false, message: 'Electrician not found' });
        }

        if (!electrician.isVerified) {
            return res.status(403).json({ success: false, message: 'Your technician account is still pending verification.' });
        }

        if (!electrician.isAvailable) {
            return res.status(403).json({ success: false, message: 'Your technician account is unavailable right now.' });
        }

        const travelDistanceKm = calculateDistanceKm(
            latitude,
            longitude,
            job.locationLat,
            job.locationLng
        );

        job.electricianId = electrician.id;
        job.status = 'Accepted';
        job.acceptedAt = new Date();
        job.startCode = generateStartCode();
        job.electricianTravelDistanceKm = travelDistanceKm;
        job.electricianTravelDurationMinutes = estimateTravelMinutes(travelDistanceKm);
        job.electricianLocationLat = toNumberOrNull(latitude);
        job.electricianLocationLng = toNumberOrNull(longitude);

        await job.save();

        const usersById = await loadUsersForJobs([job]);

        res.status(200).json({
            success: true,
            message: 'Job accepted successfully',
            job: serializeJob(job, usersById),
        });
    } catch (error) {
        console.error('Accept Job Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.getJobHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const jobs = await Job.findAll({
            where: {
                [Op.or]: [{ electricianId: userId }, { householderId: userId }],
            },
            order: [['createdAt', 'DESC']],
        });

        const usersById = await loadUsersForJobs(jobs);
        const data = jobs.map((job) => serializeJob(job, usersById));

        res.status(200).json({ success: true, jobs: data });
    } catch (error) {
        console.error('Fetch Job History Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.updateJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status, actorId, finalCost, paymentMethod, latitude, longitude, startCode } = req.body;

        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (!status) {
            return res.status(400).json({ success: false, message: 'A target status is required.' });
        }

        if (actorId && job.electricianId && actorId !== job.electricianId && actorId !== job.householderId) {
            return res.status(403).json({ success: false, message: 'You cannot update this job.' });
        }

        if (status === 'InProgress') {
            if (!['Accepted', 'InProgress'].includes(job.status)) {
                return res.status(409).json({ success: false, message: 'Only accepted jobs can be started.' });
            }

            if (!startCode || String(startCode) !== String(job.startCode)) {
                return res.status(400).json({ success: false, message: 'The start code does not match the householder code.' });
            }

            job.status = 'InProgress';
            job.startedAt = job.startedAt || new Date();
            job.startCodeVerifiedAt = new Date();
            job.electricianLocationLat = toNumberOrNull(latitude) ?? job.electricianLocationLat;
            job.electricianLocationLng = toNumberOrNull(longitude) ?? job.electricianLocationLng;
        } else if (status === 'Completed') {
            if (!['Accepted', 'InProgress'].includes(job.status)) {
                return res.status(409).json({ success: false, message: 'Only active jobs can be completed.' });
            }

            const resolvedAmount = Number(finalCost ?? job.estimatedCost ?? 0);
            if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
                return res.status(400).json({ success: false, message: 'A valid final amount is required to complete the job.' });
            }

            const normalizedPaymentMethod = paymentMethod === 'Cash' ? 'Cash' : 'Digital';
            job.finalCost = Number(resolvedAmount.toFixed(2));
            job.paymentMethod = normalizedPaymentMethod;
            job.electricianLocationLat = toNumberOrNull(latitude) ?? job.electricianLocationLat;
            job.electricianLocationLng = toNumberOrNull(longitude) ?? job.electricianLocationLng;

            if (normalizedPaymentMethod === 'Cash') {
                job.status = 'Completed';
                job.completedAt = new Date();
                job.digitalPaymentStatus = null;
                job.digitalPaymentAmount = null;
                job.digitalPaymentReference = null;
                job.digitalPaymentMeta = null;
                job.digitalPaidAt = null;
                job.paymentConfirmedAt = null;
                await applyCashEarningsToElectrician(job.electricianId, resolvedAmount);
            } else {
                job.status = 'PaymentPending';
                job.completedAt = null;
                job.digitalPaymentStatus = 'Pending';
                job.digitalPaymentAmount = Number(resolvedAmount.toFixed(2));
            }
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported job status update.' });
        }

        await job.save();
        const usersById = await loadUsersForJobs([job]);
        return res.status(200).json({
            success: true,
            message: `Job marked as ${status}`,
            job: serializeJob(job, usersById),
        });
    } catch (error) {
        console.error('Update Job Status Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.submitDigitalPayment = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { householderId, cardHolderName, cardNumber, expiryMonth, expiryYear } = req.body;

        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.householderId !== householderId) {
            return res.status(403).json({ success: false, message: 'You cannot pay for this job.' });
        }

        if (
            job.paymentMethod === 'Digital' &&
            job.status === 'AwaitingTechnicianConfirmation' &&
            job.digitalPaymentStatus === 'Paid'
        ) {
            const usersById = await loadUsersForJobs([job]);
            return res.status(200).json({
                success: true,
                message: 'Digital payment already submitted. Waiting for technician confirmation.',
                job: serializeJob(job, usersById),
            });
        }

        if (
            job.paymentMethod === 'Digital' &&
            job.status === 'Completed' &&
            ['Paid', 'Confirmed'].includes(job.digitalPaymentStatus)
        ) {
            const usersById = await loadUsersForJobs([job]);
            return res.status(200).json({
                success: true,
                message: 'Digital payment already completed for this job.',
                job: serializeJob(job, usersById),
            });
        }

        if (job.status !== 'PaymentPending' || job.paymentMethod !== 'Digital') {
            return res.status(409).json({ success: false, message: 'This job is not waiting for digital payment.' });
        }

        const normalizedCardNumber = String(cardNumber || '').replace(/\s+/g, '');
        const cardLast4 = normalizedCardNumber.slice(-4);
        if (cardLast4.length !== 4) {
            return res.status(400).json({ success: false, message: 'Enter valid payment details.' });
        }

        job.status = 'AwaitingTechnicianConfirmation';
        job.digitalPaymentStatus = 'Paid';
        job.digitalPaidAt = new Date();
        job.digitalPaymentReference = `TXN-${Date.now()}`;
        job.digitalPaymentMeta = {
            cardHolderName: cardHolderName || 'Householder',
            cardLast4,
            expiryMonth: expiryMonth || '',
            expiryYear: expiryYear || '',
        };
        await job.save();

        const usersById = await loadUsersForJobs([job]);
        return res.status(200).json({
            success: true,
            message: 'Dummy payment processed successfully',
            job: serializeJob(job, usersById),
        });
    } catch (error) {
        console.error('Submit Digital Payment Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.confirmDigitalPayment = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { electricianId } = req.body;

        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.electricianId !== electricianId) {
            return res.status(403).json({ success: false, message: 'You cannot confirm this payment.' });
        }

        if (job.status !== 'AwaitingTechnicianConfirmation' || job.digitalPaymentStatus !== 'Paid') {
            return res.status(409).json({ success: false, message: 'No payment is waiting for technician confirmation.' });
        }

        const resolvedAmount = Number(job.finalCost || job.digitalPaymentAmount || job.estimatedCost || 0);
        if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'This job has no valid digital payment amount.' });
        }

        job.status = 'Completed';
        job.completedAt = new Date();
        job.paymentConfirmedAt = new Date();
        job.digitalPaymentStatus = 'Confirmed';
        await job.save();

        await applyDigitalEarningsToElectrician(job.electricianId, resolvedAmount);

        const usersById = await loadUsersForJobs([job]);
        return res.status(200).json({
            success: true,
            message: 'Digital payment confirmed and job completed.',
            job: serializeJob(job, usersById),
        });
    } catch (error) {
        console.error('Confirm Digital Payment Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.rateJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { householderId, rating, feedback } = req.body;

        const parsedRating = Number(rating);
        if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ success: false, message: 'A rating between 1 and 5 is required.' });
        }

        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.householderId !== householderId) {
            return res.status(403).json({ success: false, message: 'You can only rate your own job.' });
        }

        if (job.status !== 'Completed') {
            return res.status(409).json({ success: false, message: 'Only completed jobs can be rated.' });
        }

        job.householderRating = parsedRating;
        job.householderFeedback = feedback || null;
        job.ratedAt = new Date();
        await job.save();

        await refreshElectricianRating(job.electricianId);

        const usersById = await loadUsersForJobs([job]);
        return res.status(200).json({
            success: true,
            message: 'Rating submitted successfully',
            job: serializeJob(job, usersById),
        });
    } catch (error) {
        console.error('Rate Job Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.cancelJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findByPk(jobId);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const now = new Date();
        const diffInMs = now - job.createdAt;
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const travelFeeApplied = diffInMinutes > 5;

        job.status = 'Cancelled';
        job.cancelledAt = now;
        job.travelFeeApplied = travelFeeApplied;
        job.cancellationReason = req.body.reason || 'Householder cancelled';

        await job.save();

        res.status(200).json({ success: true, message: 'Job cancelled successfully', travelFeeApplied });
    } catch (error) {
        console.error('Cancel Job Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};
