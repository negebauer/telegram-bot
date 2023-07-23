while true; do

echo "Looking...    $(date)"

echo $(date) >> all_runs.log
{ time node src/visa.js | tee last_run.log >> all_runs.log ; } 2>> all_runs.log
echo "" >> all_runs.log

if grep -q 'Appointment is earlier!' last_run.log; then
  prev=$(grep 'Current appointment' last_run.log)
  new=$(grep 'Found appointment' last_run.log)
  osascript -e "display notification \"$prev\" with title \"Visa appointment\" subtitle \"$new\" sound name \"Ping\""
  echo "Found appointment! Go get it: $VISA_URL"
else
  echo "Nothing...    $(date)"
fi

# wait 10 minutes
sleep "$((60*10))"

done
