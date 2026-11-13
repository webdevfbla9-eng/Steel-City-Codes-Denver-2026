// mode 'code': the volunteer writes a function that is run against `tests`.
// mode 'predict': the volunteer reads the code and types its exact console output.

export const languages = [
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'javascript', label: 'Web Dev (JavaScript)' },
];

export const challenges = [
  {
    id: 'py-vowels',
    language: 'python',
    mode: 'code',
    level: 'Intro',
    title: 'Count the Vowels',
    prompt:
      'Write count_vowels(word) that returns how many vowels (a, e, i, o, u) are in word. Uppercase letters count too.',
    fnName: 'count_vowels',
    starter: `def count_vowels(word):
    # Return the number of vowels in word
    pass
`,
    tests: [
      { args: ['steel'], expected: 2 },
      { args: ['Python'], expected: 1 },
      { args: ['AEIOU'], expected: 5 },
      { args: ['rhythm'], expected: 0 },
      { args: [''], expected: 0 },
    ],
  },
  {
    id: 'py-fizzbuzz',
    language: 'python',
    mode: 'code',
    level: 'Intro',
    title: 'FizzBuzz List',
    prompt:
      'Write fizzbuzz(n) that returns a list of strings from 1 to n. Use "Fizz" for multiples of 3, "Buzz" for multiples of 5, and "FizzBuzz" for multiples of both.',
    fnName: 'fizzbuzz',
    starter: `def fizzbuzz(n):
    result = []
    # Fill result with the correct strings
    return result
`,
    tests: [
      { args: [1], expected: ['1'] },
      { args: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
      {
        args: [15],
        expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'],
      },
    ],
  },
  {
    id: 'py-frequency',
    language: 'python',
    mode: 'code',
    level: 'Intermediate',
    title: 'Word Frequency',
    prompt:
      'Write word_frequency(sentence) that returns a dictionary mapping each lowercase word to how many times it appears. Words are separated by spaces.',
    fnName: 'word_frequency',
    starter: `def word_frequency(sentence):
    counts = {}
    # Count each word (ignore uppercase vs lowercase)
    return counts
`,
    tests: [
      { args: ['the cat and the hat'], expected: { the: 2, cat: 1, and: 1, hat: 1 } },
      { args: ['Code code CODE'], expected: { code: 3 } },
      { args: [''], expected: {} },
    ],
  },
  {
    id: 'py-palindrome',
    language: 'python',
    mode: 'code',
    level: 'Intermediate',
    title: 'Palindrome Checker',
    prompt:
      'Write is_palindrome(text) that returns True if text reads the same forwards and backwards, ignoring case, spaces and punctuation.',
    fnName: 'is_palindrome',
    starter: `def is_palindrome(text):
    # Hint: keep only letters and numbers first
    pass
`,
    tests: [
      { args: ['racecar'], expected: true },
      { args: ['Steel City'], expected: false },
      { args: ['A man, a plan, a canal: Panama'], expected: true },
      { args: [''], expected: true },
    ],
  },
  {
    id: 'java-loop',
    language: 'java',
    mode: 'predict',
    level: 'Intro',
    title: 'Loop with continue',
    prompt: 'What does this program print? Type the exact output.',
    code: `public class Main {
    public static void main(String[] args) {
        int total = 0;
        for (int i = 1; i <= 5; i++) {
            if (i % 2 == 0) {
                continue;
            }
            total += i;
        }
        System.out.println(total);
    }
}`,
    answer: '9',
  },
  {
    id: 'java-strings',
    language: 'java',
    mode: 'predict',
    level: 'Intro',
    title: 'String Methods',
    prompt: 'What does this program print? Put each line of output on its own line.',
    code: `public class Main {
    public static void main(String[] args) {
        String word = "SteelCity";
        System.out.println(word.length());
        System.out.println(word.charAt(5));
        System.out.println(word.substring(0, 5).toUpperCase());
        System.out.println(word.indexOf("C"));
    }
}`,
    answer: '9\nC\nSTEEL\n5',
  },
  {
    id: 'java-nested',
    language: 'java',
    mode: 'predict',
    level: 'Intermediate',
    title: 'Nested Loops',
    prompt: 'What does this program print? Put each line of output on its own line.',
    code: `public class Main {
    public static void main(String[] args) {
        for (int row = 1; row <= 3; row++) {
            String line = "";
            for (int col = 0; col < row; col++) {
                line += "*";
            }
            System.out.println(line);
        }
    }
}`,
    answer: '*\n**\n***',
  },
  {
    id: 'java-division',
    language: 'java',
    mode: 'predict',
    level: 'Intermediate',
    title: 'Integer Division and Casting',
    prompt: 'What does this program print? Put each line of output on its own line.',
    code: `public class Main {
    public static void main(String[] args) {
        int a = 17;
        int b = 5;
        System.out.println(a / b);
        System.out.println(a % b);
        System.out.println((double) a / b);
        System.out.println(a / b * b + a % b);
    }
}`,
    answer: '3\n2\n3.4\n17',
  },
  {
    id: 'js-title',
    language: 'javascript',
    mode: 'code',
    level: 'Intro',
    title: 'Title Case',
    prompt: 'Write toTitleCase(str) that capitalizes the first letter of every word and lowercases the rest.',
    fnName: 'toTitleCase',
    starter: `function toTitleCase(str) {
  // "steel city codes" -> "Steel City Codes"
}
`,
    tests: [
      { args: ['steel city codes'], expected: 'Steel City Codes' },
      { args: ['hELLO wORLD'], expected: 'Hello World' },
      { args: [''], expected: '' },
    ],
  },
  {
    id: 'js-tag',
    language: 'javascript',
    mode: 'code',
    level: 'Intro',
    title: 'Build an HTML Tag',
    prompt:
      'Write buildTag(tag, text, className) that returns an HTML string. If className is given, add it as a class attribute.',
    fnName: 'buildTag',
    starter: `function buildTag(tag, text, className) {
  // buildTag("p", "Hi", "intro") -> '<p class="intro">Hi</p>'
}
`,
    tests: [
      { args: ['h1', 'Welcome'], expected: '<h1>Welcome</h1>' },
      { args: ['p', 'Learn to code', 'intro'], expected: '<p class="intro">Learn to code</p>' },
      { args: ['button', 'Sign up', 'arrow-button'], expected: '<button class="arrow-button">Sign up</button>' },
    ],
  },
  {
    id: 'js-filter',
    language: 'javascript',
    mode: 'code',
    level: 'Intermediate',
    title: 'Filter Volunteers by Grade',
    prompt:
      'Write highSchoolers(people) that returns the names of everyone in grades 9 through 12, in the same order.',
    fnName: 'highSchoolers',
    starter: `function highSchoolers(people) {
  // people looks like [{ name: "Ana", grade: 10 }, ...]
}
`,
    tests: [
      {
        args: [[{ name: 'Ana', grade: 8 }, { name: 'Ben', grade: 9 }, { name: 'Cy', grade: 12 }]],
        expected: ['Ben', 'Cy'],
      },
      { args: [[{ name: 'Dee', grade: 13 }, { name: 'Eli', grade: 11 }]], expected: ['Eli'] },
      { args: [[]], expected: [] },
    ],
  },
];
