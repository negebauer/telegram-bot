while true; do

node src/visa.js | tee last_run.log >> all_runs.log
echo "" >> all_runs.log

if grep -q 'Appointment is earlier!' last_run.log; then
  prev=$(grep 'Current appointment' last_run.log)
  new=$(grep 'Found appointment' last_run.log)
  osascript -e "display notification \"$prev\" with title \"Visa appointment\" subtitle \"$new\" sound name \"Ping\""
  echo $VISA_URL
fi

done
