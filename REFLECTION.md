# Reflection: AI-Assisted Engineering

### The "Force Multiplier" Effect
Building the FuelEU engine with Gemini was not about asking the AI to "write code for me," but rather treating it as a specialized junior engineer who types incredibly fast but needs strict supervision.

My efficiency gains were non-linear.
* **Boilerplate (10x Speed):** Creating the Pydantic models for the 15 different fuel types defined in the EU regulation took seconds. Doing this manually—copy-pasting values from the PDF into a Python Enum—would have been a 45-minute task prone to typo errors.
* **Regex Generation (5x Speed):** Parsing the "Bunker Delivery Notes" is messy. I simply pasted 10 examples of messy strings into the prompt, and Gemini generated a robust Regex pattern that covered 90% of cases immediately.
* **Logic Implementation (2x Speed):** Writing the GHG intensity algorithm was faster, but required heavy verification.

### Friction Points & Hallucinations
There were specific moments where the AI failed, requiring me to step in as the domain expert:

1.  **Context Drift:** In long conversation threads (over 30 turns), Gemini started forgetting that we were using `SQLAlchemy 2.0` syntax and reverted to `1.4` (e.g., trying to use `session.query()` instead of `select()`). I had to frequently "re-prime" the context.
2.  **Precision Errors:** When I asked for the penalty calculation, the initial Python code used standard `float` math. For a financial application dealing with penalties in the range of €50,000+, floating-point drift is unacceptable. I had to explicitly reject the code and force the use of `decimal.Decimal`.
3.  **Regulatory Nuance:** The AI treats all text as equal. It didn't initially understand that "Wind Propulsion" isn't a fuel with a calorific value but a reward factor. I had to architect that class hierarchy myself.

### What I Learned & Future Improvements
The most critical lesson is that **Prompt Engineering is actually Requirements Engineering.**

If I gave a vague prompt like "Make a calculator," I got garbage code. When I gave a prompt like "Implement Article 10, using these specific variable names, handling these edge cases," I got production-ready code.

**Next time, I will:**
* **Use "Context Files":** Instead of pasting context repeatedly, I will maintain a `context.md` file with the project structure and library versions, pasting it at the start of every session.
* **Review Mode:** I realized late in the project that I could write the code *myself* and ask Gemini to "review this for edge cases." This was often more valuable than asking it to generate the code from scratch.
* **Test-First Generation:** I will ask the agent to write the `pytest` cases *before* writing the implementation. This forces the agent to understand the requirements fully before generating the solution.