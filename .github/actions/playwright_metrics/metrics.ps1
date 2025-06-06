param (
  [string]$CurrentReport,
  [string]$BaselineReport
)

$total_tests = jq '[.suites[].suites[].specs[].tests] | length' $CurrentReport
$failures = jq '[.suites[].suites[].specs[].tests[] | select(all(.results[]; .status == "failed"))] | length' $CurrentReport

$total_baseline_tests = jq '[.suites[].suites[].specs[].tests] | length' $BaselineReport
$baseline_failures = jq '[.suites[].suites[].specs[].tests[] | select(all(.results[]; .status == "failed"))] | length' $BaselineReport

if ($total_tests -ne 0) {
  $failure_percent = "{0:N2}%" -f (($failures / [double]$total_tests) * 100)
} else {
  $failure_percent = "N/A"
}
if ($total_baseline_tests -ne 0) {
  $baseline_failure_percent = "{0:N2}%" -f (($baseline_failures / [double]$total_baseline_tests) * 100)
} else {
  $baseline_failure_percent = "N/A"
}

$total_tests = $total_tests.ToString().PadLeft(5, ' ')
$failures = $failures.ToString().PadLeft(5, ' ')
$total_baseline_tests = $total_baseline_tests.ToString().PadLeft(5, ' ')
$baseline_failures = $baseline_failures.ToString().PadLeft(5, ' ')
$failure_percent = $failure_percent.PadLeft(5, ' ')
$baseline_failure_percent = $baseline_failure_percent.PadLeft(5, ' ')

echo "### Test Results" >> $env:GITHUB_STEP_SUMMARY
echo "| Metric        | Baseline | Current  |" >> $env:GITHUB_STEP_SUMMARY
echo "|---------------|----------|----------|" >> $env:GITHUB_STEP_SUMMARY
echo "| Total Tests   |   $total_baseline_tests  |   $total_tests  |" >> $env:GITHUB_STEP_SUMMARY
echo "| Failures      |   $baseline_failures  |   $failures  |" >> $env:GITHUB_STEP_SUMMARY
echo "| Failure %     |   $baseline_failure_percent  |   $failure_percent  |" >> $env:GITHUB_STEP_SUMMARY

# Get titles of failed tests in current and baseline
$current_failed_titles = jq -r '[.suites[].suites[].specs[] | select(all(.tests[].results[]; .status == "failed")) | .title] | .[]' $CurrentReport
$baseline_failed_titles = jq -r '[.suites[].suites[].specs[] | select(all(.tests[].results[]; .status == "failed")) | .title] | .[]' $BaselineReport

# Convert to arrays
$current_failed = $current_failed_titles -split "`n"
$baseline_failed = $baseline_failed_titles -split "`n"

# Find tests failing in current but not in baseline
$new_failures = $current_failed | Where-Object { $_ -and ($_ -notin $baseline_failed) }

if ($new_failures.Count -gt 0) {
    echo "`n#### New Failures (failing now, but not in baseline):" >> $env:GITHUB_STEP_SUMMARY
    foreach ($fail in $new_failures) {
        echo "- $fail" >> $env:GITHUB_STEP_SUMMARY
    }
}