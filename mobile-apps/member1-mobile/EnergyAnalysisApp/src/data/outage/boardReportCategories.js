import { theme } from '../../theme/outage';

export const getBoardReportCategories = (t) => [
    {
        id: 'transformer',
        title: t('member2.boardIssue.categories.transformer.title'),
        icon: 'flash',
        color: theme.colors.warning,
        points: t('member2.boardIssue.categories.transformer.points', { returnObjects: true }),
    },
    {
        id: 'power-lines',
        title: t('member2.boardIssue.categories.powerLines.title'),
        icon: 'git-branch',
        color: theme.colors.primaryLight,
        points: t('member2.boardIssue.categories.powerLines.points', { returnObjects: true }),
    },
    {
        id: 'weather-damage',
        title: t('member2.boardIssue.categories.weatherDamage.title'),
        icon: 'rainy',
        color: theme.colors.secondary,
        points: t('member2.boardIssue.categories.weatherDamage.points', { returnObjects: true }),
    },
    {
        id: 'pole-issues',
        title: t('member2.boardIssue.categories.poleIssues.title'),
        icon: 'flag',
        color: theme.colors.categoryOrange,
        points: t('member2.boardIssue.categories.poleIssues.points', { returnObjects: true }),
    },
    {
        id: 'short-circuit-fire',
        title: t('member2.boardIssue.categories.shortCircuitFire.title'),
        icon: 'flame',
        color: theme.colors.danger,
        points: t('member2.boardIssue.categories.shortCircuitFire.points', { returnObjects: true }),
    },
    {
        id: 'area-power-failure',
        title: t('member2.boardIssue.categories.areaPowerFailure.title'),
        icon: 'flash-off',
        color: theme.colors.warningDark,
        points: t('member2.boardIssue.categories.areaPowerFailure.points', { returnObjects: true }),
    },
    {
        id: 'substation',
        title: t('member2.boardIssue.categories.substation.title'),
        icon: 'settings',
        color: theme.colors.categoryGreen,
        points: t('member2.boardIssue.categories.substation.points', { returnObjects: true }),
    },
    {
        id: 'meter-service-line',
        title: t('member2.boardIssue.categories.meterServiceLine.title'),
        icon: 'speedometer',
        color: theme.colors.primary,
        points: t('member2.boardIssue.categories.meterServiceLine.points', { returnObjects: true }),
    },
    {
        id: 'external-causes',
        title: t('member2.boardIssue.categories.externalCauses.title'),
        icon: 'construct',
        color: theme.colors.categoryAmber,
        points: t('member2.boardIssue.categories.externalCauses.points', { returnObjects: true }),
    },
    {
        id: 'unknown',
        title: t('member2.boardIssue.categories.unknown.title'),
        icon: 'help-circle',
        color: theme.colors.textSecondary,
        points: t('member2.boardIssue.categories.unknown.points', { returnObjects: true }),
    },
];
