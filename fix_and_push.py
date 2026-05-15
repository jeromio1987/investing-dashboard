"""Run this from PowerShell: python fix_and_push.py"""
import os, subprocess, sys

repo = r"C:\Users\jerom\Desktop\claude\Prive\investing"
os.chdir(repo)

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.stderr.strip(): print("  STDERR:", r.stderr.strip())
    return r.returncode

print("=== Fixing repo ===")

# 1 - remove stale locks
for lock in [".git/index.lock", ".git/refs/heads/main.lock"]:
    if os.path.exists(lock):
        os.remove(lock)
        print(f"Removed {lock}")

# 2 - stage
print("\nStaging...")
run("git add index.html layouts/george-preview.html")

# 3 - commit
print("Committing...")
rc = run('git commit -m "Full update: adam2.mp3 intro, Manifesto + Setup Score tabs"')

# 4 - push
print("Pushing...")
rc2 = run("git push")
if rc2 == 0:
    print("\nDone. Wait 2 min then Ctrl+Shift+R on the site.")
else:
    print("\nPush failed - check credentials and retry: git push")
