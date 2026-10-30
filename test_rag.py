from backend.genai.rag import ask_maintenance_assistant

question = "What should I check if machine temperature increases unexpectedly?"

result = ask_maintenance_assistant(question)

print("\nAI ANSWER:\n")
print(result["answer"])

print("\nSOURCES:\n")
for source in result["sources"]:
    print(source)