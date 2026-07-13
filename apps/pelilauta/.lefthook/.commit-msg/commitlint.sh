INPUT_FILE=$1
START_LINE=`head -n1 $INPUT_FILE`
ERROR=`echo $START_LINE | npx commitlint --color`
if ! [[ $? == 0 ]]; then
  echo "${ERROR}"
  exit 1
fi