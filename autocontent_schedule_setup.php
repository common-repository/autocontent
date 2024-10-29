<?php
function autocontent_setup_cron_jobs() {
    $frequency = get_option('autocontent_frequency');
    $frequency = empty($frequency) ? 'monthly' : $frequency;

    error_log('Start Autocontent Schedule Cron Job');

    if ($frequency === 'daily') {
        $interval = 86400; // 24 hours in seconds
    } elseif ($frequency === 'weekly') {
        $interval = 604800; // 7 days in seconds
    } elseif ($frequency === 'monthly') {
        // Schedule monthly events
        for ($i = 0; $i < 12; $i++) {
            $next_month_timestamp = strtotime("+{$i} month", strtotime('first day of next month'));
            wp_schedule_single_event($next_month_timestamp, 'autocontent_monthly_hook');
        }
        return; // Exit function after scheduling monthly events
    }

    // Schedule recurring events based on frequency
    wp_schedule_event(time(), $frequency, 'autocontent_event_hook');

    error_log('End Autocontent Schedule Cron Job');
}

function autocontent_remove_cron_jobs() {
    // Unschedule the recurring event if it exists
    if (wp_next_scheduled('autocontent_event_hook')) {
        wp_unschedule_event(wp_next_scheduled('autocontent_event_hook'), 'autocontent_event_hook');
    }

    // Unschedule all monthly events
    if (wp_next_scheduled('autocontent_monthly_hook')) {
        $timestamp = wp_next_scheduled('autocontent_monthly_hook');
        while ($timestamp) {
            wp_unschedule_event($timestamp, 'autocontent_monthly_hook');
            $timestamp = wp_next_scheduled('autocontent_monthly_hook');
        }
    }
}
?>
