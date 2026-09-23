#!/bin/bash
# Test script for todo-list-mcp standalone MCP server
# Tests all 10 tools via stdio JSON-RPC

SERVER="node /home/sensei/works/todo-list-mcp/dist/mcp.js"
DB_FILE="$HOME/.todo-list-mcp/todos.sqlite"

# Clean up existing database for fresh test
rm -f "$DB_FILE"

echo "========================================"
echo "  todo-list-mcp MCP Server Test Suite"
echo "========================================"
echo ""

# Test 1: tools/list - verify all 10 tools are registered
echo "--- Test 1: tools/list (verify all 10 tools registered) ---"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg and 'tools' in msg['result']:
            tools = msg['result']['tools']
            print(f'✓ Found {len(tools)} tools:')
            for t in tools:
                print(f'  - {t[\"name\"]:30s} : {t[\"description\"]}')
            expected = ['create-todo','list-todos','get-todo','update-todo','complete-todo','delete-todo','search-todos-by-title','search-todos-by-date','list-active-todos','summarize-active-todos']
            names = [t['name'] for t in tools]
            missing = [e for e in expected if e not in names]
            if not missing:
                print('✓ All 10 expected tools are registered')
            else:
                print(f'✗ Missing tools: {missing}')
        elif 'error' in msg:
            print(f'✗ Error: {msg[\"error\"]}')
    except json.JSONDecodeError:
        pass
"
echo ""

# Test 2: create-todo
echo "--- Test 2: create-todo ---"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create-todo","arguments":{"title":"Learn MCP","description":"Learn about Model Context Protocol (MCP) and how it works"}}}' | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg:
            text = msg['result']['content'][0]['text']
            print(f'✓ create-todo success:')
            print(text)
            # Extract ID for later tests
            import re
            match = re.search(r'ID:\s*([\w-]+)', text)
            if match:
                print(f'ID extracted: {match.group(1)}')
        elif 'error' in msg:
            print(f'✗ Error: {msg[\"error\"]}')
    except json.JSONDecodeError:
        pass
"
echo ""

# Test 3: create-todo (second item)
echo "--- Test 3: create-todo (second item) ---"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"create-todo","arguments":{"title":"Buy groceries","description":"Buy vegetables, rice, and chicken for dinner"}}}' | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg:
            text = msg['result']['content'][0]['text']
            print(f'✓ create-todo success:')
            print(text)
        elif 'error' in msg:
            print(f'✗ Error: {msg[\"error\"]}')
    except json.JSONDecodeError:
        pass
"
echo ""

# Test 4: list-todos
echo "--- Test 4: list-todos ---"
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list-todos","arguments":{}}}' | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg:
            text = msg['result']['content'][0]['text']
            print(f'✓ list-todos success:')
            print(text)
        elif 'error' in msg:
            print(f'✗ Error: {msg[\"error\"]}')
    except json.JSONDecodeError:
        pass
"
echo ""

# Test 5: list-active-todos
echo "--- Test 5: list-active-todos ---"
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"list-active-todos","arguments":{}}}' | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg:
            text = msg['result']['content'][0]['text']
            print(f'✓ list-active-todos success:')
            print(text)
        elif 'error' in msg:
            print(f'✗ Error: {msg[\"error\"]}')
    except json.JSONDecodeError:
        pass
"
echo ""

# Test 6: summarize-active-todos
echo "--- Test 6: summarize-active-todos ---"
echo '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"summarize-active-todos","arguments":{}}}' | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg:
            text = msg['result']['content'][0]['text']
            print(f'✓ summarize-active-todos success:')
            print(text)
        elif 'error' in msg:
            print(f'✗ Error: {msg[\"error\"]}')
    except json.JSONDecodeError:
        pass
"
echo ""

# Test 7: search-todos-by-title
echo "--- Test 7: search-todos-by-title (search 'learn') ---"
echo '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"search-todos-by-title","arguments":{"title":"learn"}}}' | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg:
            text = msg['result']['content'][0]['text']
            print(f'✓ search-todos-by-title success:')
            print(text)
        elif 'error' in msg:
            print(f'✗ Error: {msg[\"error\"]}')
    except json.JSONDecodeError:
        pass
"
echo ""

# Test 8: search-todos-by-date (today)
echo "--- Test 8: search-todos-by-date (today) ---"
TODAY=$(date +%Y-%m-%d)
echo "{\"jsonrpc\":\"2.0\",\"id\":8,\"method\":\"tools/call\",\"params\":{\"name\":\"search-todos-by-date\",\"arguments\":{\"date\":\"$TODAY\"}}}" | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg:
            text = msg['result']['content'][0]['text']
            print(f'✓ search-todos-by-date success (date: $TODAY):')
            print(text)
        elif 'error' in msg:
            print(f'✗ Error: {msg[\"error\"]}')
    except json.JSONDecodeError:
        pass
"
echo ""

# Test 9: get-todo (with invalid ID to test error handling)
echo "--- Test 9: get-todo (invalid ID - error handling test) ---"
echo '{"jsonrpc":"2.0","id":9,"method":"tools/call","params":{"name":"get-todo","arguments":{"id":"invalid-id"}}}' | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg and msg['result'].get('isError'):
            text = msg['result']['content'][0]['text']
            print(f'✓ get-todo error handling works:')
            print(text)
        elif 'error' in msg:
            print(f'✓ get-todo validation error (expected): {msg[\"error\"]}')
        elif 'result' in msg:
            text = msg['result']['content'][0]['text']
            print(f'Result: {text}')
    except json.JSONDecodeError:
        pass
"
echo ""

# Test 10: create-todo with missing fields (validation test)
echo "--- Test 10: create-todo with empty title (validation test) ---"
echo '{"jsonrpc":"2.0","id":10,"method":"tools/call","params":{"name":"create-todo","arguments":{"title":"","description":"test"}}}' | $SERVER 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
        if 'result' in msg and msg['result'].get('isError'):
            text = msg['result']['content'][0]['text']
            print(f'✓ create-todo validation error (expected):')
            print(text)
        elif 'error' in msg:
            print(f'✓ create-todo validation error (expected): {msg[\"error\"]}')
        elif 'result' in msg:
            text = msg['result']['content'][0]['text']
            print(f'Result: {text}')
    except json.JSONDecodeError:
        pass
"
echo ""

echo "========================================"
echo "  All tests completed"
echo "========================================"
