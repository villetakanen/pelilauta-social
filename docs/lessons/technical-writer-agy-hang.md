# technical-writer can hang indefinitely with no output

`pnpm technical-writer <paths>` runs `agents/technical-writer/run.sh`, which drives
`agy -p ... --print-timeout 10m`. On one run (2026-09-07) `agy` stalled at startup
and produced zero output for ~1.7h; the `--print-timeout 10m` did not kill it.
Piping the command through `tail -40` also hid the run.sh startup echoes, so the
0-byte output file read as a total hang rather than a stalled `agy`.

What worked: kill the pnpm/agy process tree, then re-run with `WRITER_PRINT_TIMEOUT`
set lower and `run_in_background` streaming (unpiped) so startup output is visible
within seconds and a stall is distinguishable from slow work.

Possible harness change to weigh at retro: make run.sh enforce a hard wall-clock
kill around `agy` independent of `--print-timeout`, and/or emit a heartbeat so a
stall is visible without unpiped streaming.
