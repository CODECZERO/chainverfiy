
import sys

def check_balance(file_path):
    brace_stack = []
    paren_stack = []
    
    with open(file_path, 'r') as f:
        for i, line in enumerate(f, 1):
            for char in line:
                if char == '{':
                    brace_stack.append(i)
                elif char == '}':
                    if brace_stack:
                        brace_stack.pop()
                    else:
                        print(f"ERROR: Extra '}}' at line {i}")
                elif char == '(':
                    paren_stack.append(i)
                elif char == ')':
                    if paren_stack:
                        paren_stack.pop()
                    else:
                        print(f"ERROR: Extra ')' at line {i}")
                        
    if brace_stack:
        print(f"ERROR: Unclosed '{{' opened at lines: {brace_stack}")
    if paren_stack:
        print(f"ERROR: Unclosed '(' opened at lines: {paren_stack}")

if __name__ == "__main__":
    check_balance(sys.argv[1])
