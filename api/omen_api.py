import os
import time
import hashlib
import logging
import subprocess
import json as pyjson
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from web3 import Web3

# LEGACY API
#
# This Flask service predates the active Next.js Home/Builder product flow.
# It still contains hash-derived demo values and a backend private-key
# submission path. Do not describe it as the current Omen product model.
# The active product reads OmenRegistry through Next.js and sends write
# transactions from the connected wallet.

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger("omen-api")

app = Flask(__name__)
CORS(app)

RITUAL_RPC           = os.getenv("RITUAL_RPC_URL", "https://rpc.ritualfoundation.org")
PRIVATE_KEY          = os.getenv("PRIVATE_KEY", "")
JUDGMENT_ADDRESS     = os.getenv("OMEN_JUDGMENT_ADDRESS", "")
REGISTRY_ADDRESS     = os.getenv("OMEN_REGISTRY_ADDRESS", "")
AGENT_AWARE_ADDRESS  = os.getenv("OMEN_AGENT_AWARE_ADDRESS", "")
AGENT_DIRECT_ADDRESS = os.getenv("OMEN_AGENT_DIRECT_ADDRESS", "")

w3 = Web3(Web3.HTTPProvider(RITUAL_RPC))

VERDICT_NAMES   = ["UNSEEN","SEALED","PENDING","REVOKED","LAPSED"]
VERDICT_ACTIONS = {0:"COLLECT",1:"ALLOW",2:"REVIEW",3:"DENY",4:"REFRESH"}

def verdict_name(v):   return VERDICT_NAMES[v] if 0 <= v <= 4 else "UNKNOWN"
def verdict_action(v): return VERDICT_ACTIONS.get(v,"UNKNOWN")

def build_signal_object(subject, domain, block_window=1000):
    current_block = w3.eth.block_number
    start_block   = max(0, current_block - block_window)
    addr_hash     = int(hashlib.sha256(subject.encode()).hexdigest(), 16)
    if domain == "counterparty_trust.ritual_trade_v1":
        features = [(addr_hash % 80)+5,(addr_hash>>8)%10,(addr_hash>>16)%20+1,(addr_hash>>24)%8,1 if (addr_hash%100)>85 else 0]
        names = ["tx_count","failed_tx","unique_counterparties","unbounded_approvals","flagged_interactions"]
    elif domain == "agent_safety.ritual_infernet_v1":
        features = [(addr_hash%50)+5,(addr_hash>>8)%5,1 if (addr_hash%100)>90 else 0,(addr_hash>>16)%3,(addr_hash>>24)%100]
        names = ["action_count","failed_actions","unauthorized_attempts","model_changes","anomaly_score"]
    else:
        features = [10,1,5,0,0]
        names    = ["f0","f1","f2","f3","f4"]
    raw         = f"{subject}:{domain}:{start_block}:{current_block}:{features}"
    merkle_root = "0x" + hashlib.sha256(raw.encode()).hexdigest()
    return {"subject":subject,"domain":domain,"startBlock":start_block,"endBlock":current_block,"merkleRoot":merkle_root,"features":features,"featureNames":names,"buildTime":int(time.time())}

def evaluate_locally(domain, features):
    if domain == "counterparty_trust.ritual_trade_v1":
        tx_count,failed_tx,_,unbounded,flagged = features[:5]
        if tx_count < 3:                                  return 0,"Insufficient transaction history"
        if flagged > 0 or unbounded > 5:                  return 3,"Flagged interactions or excessive unbounded approvals"
        if failed_tx > 0 and failed_tx >= tx_count // 3: return 2,"High failure rate, review needed"
        if tx_count >= 10:                                return 1,"Clean activity profile, trusted counterparty"
        return 2,"Activity present but limited history"
    if domain == "agent_safety.ritual_infernet_v1":
        _,_,unauthorized,_,anomaly = features[:5]
        if unauthorized > 0 or anomaly >= 70: return 3,"Unauthorized actions or high anomaly score"
        if anomaly >= 30:                     return 2,"Moderate anomaly, review recommended"
        return 1,"Agent operating within safe parameters"
    return 0,"Unknown domain"

def submit_onchain(subject, domain, features, reasoning):
    omen_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    env = os.environ.copy()
    env["OMEN_SUBJECT"]   = subject
    env["OMEN_DOMAIN"]    = domain
    env["OMEN_FEATURES"]  = pyjson.dumps(features)
    env["OMEN_REASONING"] = reasoning
    log.info(f"Submitting onchain — subject: {subject[:20]}...")
    result = subprocess.run(
        ["cmd", "/c", "npx", "hardhat", "run", "scripts/submit_tx.ts", "--network", "ritual"],
        cwd=omen_root, capture_output=True, text=True, timeout=120, env=env,
    )
    log.info(f"stdout: {result.stdout[:300]}")
    if result.stderr: log.info(f"stderr: {result.stderr[:300]}")
    tx_result = {"submitSignal":{"hash":"pending"},"evaluateVerdict":{"hash":"pending"}}
    for line in result.stdout.strip().split("\n"):
        try:
            parsed = pyjson.loads(line)
            if parsed.get("success"):
                tx_result = parsed["transactions"]
                log.info(f"Onchain success: {tx_result}")
            elif parsed.get("error"):
                log.error(f"Onchain error: {parsed['error']}")
            break
        except:
            continue
    return tx_result

@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

@app.route("/health")
def health():
    connected = w3.is_connected()
    block     = w3.eth.block_number if connected else None
    return jsonify({"status":"ok" if connected else "degraded","connected":connected,"block":block,"network":"ritual","chainId":1979,"contracts":{"judgment":JUDGMENT_ADDRESS,"registry":REGISTRY_ADDRESS,"agentAware":AGENT_AWARE_ADDRESS,"agentDirect":AGENT_DIRECT_ADDRESS}})

@app.route("/block")
def current_block():
    return jsonify({"block":w3.eth.block_number,"chainId":1979})

@app.route("/signal/summary", methods=["POST","OPTIONS"])
def signal_summary():
    if request.method == "OPTIONS": return jsonify({}), 200
    data    = request.json or {}
    subject = data.get("subject","")
    domain  = data.get("domain","counterparty_trust.ritual_trade_v1")
    if not subject: return jsonify({"error":"subject required"}), 400
    signal = build_signal_object(subject, domain)
    verdict_id, reasoning = evaluate_locally(domain, signal["features"])
    return jsonify({"subject":subject,"domain":domain,"features":dict(zip(signal["featureNames"],signal["features"])),"merkleRoot":signal["merkleRoot"],"blockWindow":{"start":signal["startBlock"],"end":signal["endBlock"]},"preview":{"verdict":verdict_name(verdict_id),"action":verdict_action(verdict_id),"reasoning":reasoning}})

@app.route("/signal/build", methods=["POST","OPTIONS"])
def build_signal():
    if request.method == "OPTIONS": return jsonify({}), 200
    data    = request.json or {}
    subject = data.get("subject","")
    domain  = data.get("domain","counterparty_trust.ritual_trade_v1")
    if not subject: return jsonify({"error":"subject required"}), 400
    signal = build_signal_object(subject, domain)
    verdict_id, reasoning = evaluate_locally(domain, signal["features"])
    return jsonify({"type":"SignalObject","version":"omen.v1","subject":subject,"domain":domain,"merkleRoot":signal["merkleRoot"],"evidence":{"features":signal["features"],"featureNames":signal["featureNames"],"featureMap":dict(zip(signal["featureNames"],signal["features"]))},"blockWindow":{"network":"ritual","chainId":1979,"startBlock":signal["startBlock"],"endBlock":signal["endBlock"]},"buildTime":signal["buildTime"],"readingArtifact":{"verdict":verdict_name(verdict_id),"verdictId":verdict_id,"action":verdict_action(verdict_id),"reasoning":reasoning}})

@app.route("/verdict/evaluate", methods=["POST","OPTIONS"])
def evaluate_verdict():
    if request.method == "OPTIONS": return jsonify({}), 200
    data    = request.json or {}
    subject = data.get("subject","")
    domain  = data.get("domain","counterparty_trust.ritual_trade_v1")
    if not subject: return jsonify({"error":"subject required"}), 400
    try:
        signal = build_signal_object(subject, domain)
        verdict_id, reasoning = evaluate_locally(domain, signal["features"])
        tx_result = submit_onchain(subject, domain, signal["features"], reasoning)
        return jsonify({"status":"evaluated","subject":subject,"domain":domain,"verdict":{"value":verdict_name(verdict_id),"verdictId":verdict_id,"action":verdict_action(verdict_id),"reasoning":reasoning},"transactions":tx_result})
    except Exception as e:
        log.error(f"evaluate_verdict error: {e}")
        return jsonify({"error":str(e)}), 500

@app.route("/verdict/read", methods=["POST","OPTIONS"])
def read_verdict():
    if request.method == "OPTIONS": return jsonify({}), 200
    data    = request.json or {}
    subject = data.get("subject","")
    domain  = data.get("domain","counterparty_trust.ritual_trade_v1")
    action  = data.get("action","trade")
    if not subject: return jsonify({"error":"subject required"}), 400
    try:
        signal = build_signal_object(subject, domain)
        verdict_id, reasoning = evaluate_locally(domain, signal["features"])
        return jsonify({"subject":subject,"domain":domain,"verdict":{"value":verdict_name(verdict_id),"verdictId":verdict_id,"action":verdict_action(verdict_id),"timestamp":int(time.time()),"isSealed":verdict_id==1,"isRevoked":verdict_id==3,"isFresh":True},"handshake":{"allowed":verdict_id==1,"reason":reasoning,"action":action}})
    except Exception as e:
        log.error(f"read_verdict error: {e}")
        return jsonify({"error":str(e)}), 500

@app.route("/domains")
def list_domains():
    return jsonify({"domains":[{"id":"counterparty_trust.ritual_trade_v1","name":"Counterparty Trust","action":"trade","question":"Should this wallet be trusted as a trading counterparty?","outcomes":["SEALED","PENDING","REVOKED","UNSEEN"],"features":["tx_count","failed_tx","unique_counterparties","unbounded_approvals","flagged_interactions"],"network":"ritual"},{"id":"agent_safety.ritual_infernet_v1","name":"Agent Safety","action":"execute","question":"Should this Ritual agent be permitted to act autonomously?","outcomes":["SEALED","PENDING","REVOKED","UNSEEN"],"features":["action_count","failed_actions","unauthorized_attempts","model_changes","anomaly_score"],"network":"ritual"}]})

@app.route("/demo/subjects")
def demo_subjects():
    return jsonify({"subjects":[{"address":"0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001","label":"Clean Trade Subject","domain":"counterparty_trust.ritual_trade_v1","action":"trade","expected":"SEALED","description":"Primary clean counterparty benchmark"},{"address":"0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c","label":"Risky Trade Subject","domain":"counterparty_trust.ritual_trade_v1","action":"trade","expected":"REVOKED","description":"Primary risky counterparty benchmark"},{"address":"0x0000000000000000000000000000000000000b0b","label":"Agent Safety Subject","domain":"agent_safety.ritual_infernet_v1","action":"execute","expected":"SEALED","description":"Dedicated agent safety benchmark"}]})

if __name__ == "__main__":
    log.info("Omen API starting on http://localhost:8000")
    log.info(f"RPC      : {RITUAL_RPC}")
    log.info(f"Judgment : {JUDGMENT_ADDRESS or '(not set)'}")
    log.info(f"Registry : {REGISTRY_ADDRESS or '(not set)'}")
    app.run(host="0.0.0.0", port=8000, debug=True)
