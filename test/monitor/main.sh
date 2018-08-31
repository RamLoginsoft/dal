#!/bin/sh

if [[ `hostname` =~ SAPI-.* ]]
	then
		# env vms should share sapi- prefix
		SAPI_PATH=/var/node/simpleAPI
	else
		# update for debugging locally
		SAPI_PATH=/Users/admin/workspace/reThinkData/simpleAPI		
fi

FOREVER=`/usr/bin/which forever`
MONITOR_PATH=$SAPI_PATH/dal/test/monitor
FOREVER_PATH=$MONITOR_PATH/logs

$FOREVER \
	start \
	-p $FOREVER_PATH \
	--sourceDir $MONITOR_PATH \
	-l app.log \
	-a \
	--spinSleepTime 10000 \
	--uid "db_monitor" \
	main.js $@ \
	>> $FOREVER_PATH/forever.log 2>&1