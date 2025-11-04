while true; do

echo "Looking...    $(date)"

echo $(date) >> all_runs.log
{ time node src/visa.js | tee last_run.log >> all_runs.log ; } 2>> all_runs.log
echo "" >> all_runs.log

if grep -q 'Appointment is earlier!' last_run.log; then
  prev=$(grep 'Current appointment' last_run.log)
  new=$(grep 'Found appointment' last_run.log)
  previous_volume=$(osascript -e 'output volume of (get volume settings)')
  osascript -e "set volume output volume 100"
  osascript -e "display notification \"$prev\" with title \"Visa appointment\" subtitle \"$new\" sound name \"Funk\""
  echo "Found appointment! Go get it: $VISA_URL"
  sleep 1 &&  osascript -e "set volume output volume $previous_volume" &
else
  echo "Nothing...    $(date)"
fi

# wait 20 minutes
sleep "$((60*20))"

done
