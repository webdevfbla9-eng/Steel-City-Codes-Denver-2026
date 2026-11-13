// One of these is shown per day, cycling in order. Same format as challenges.js.
export const dailyChallenges = [
  {
    id: 'daily-greet',
    language: 'python',
    mode: 'code',
    level: 'Python',
    title: 'Say Hello',
    prompt: 'Write greet(name) that returns a greeting like "Hello, Ana!".',
    fnName: 'greet',
    starter: `def greet(name):
    # greet("Ana") should return "Hello, Ana!"
    pass
`,
    tests: [
      { args: ['Ana'], expected: 'Hello, Ana!' },
      { args: ['Steel City'], expected: 'Hello, Steel City!' },
    ],
  },
  {
    id: 'daily-variables',
    language: 'java',
    mode: 'predict',
    level: 'Java',
    title: 'Changing Variables',
    prompt: 'What does this program print?',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 4;
        x = x * 3;
        x -= 2;
        System.out.println(x);
    }
}`,
    answer: '10',
  },
  {
    id: 'daily-double',
    language: 'python',
    mode: 'code',
    level: 'Python',
    title: 'Double Everything',
    prompt: 'Write double_all(numbers) that returns a new list with every number doubled.',
    fnName: 'double_all',
    starter: `def double_all(numbers):
    # double_all([1, 2, 3]) should return [2, 4, 6]
    pass
`,
    tests: [
      { args: [[1, 2, 3]], expected: [2, 4, 6] },
      { args: [[0, -5, 10]], expected: [0, -10, 20] },
      { args: [[]], expected: [] },
    ],
  },
  {
    id: 'daily-grades',
    language: 'java',
    mode: 'predict',
    level: 'Java',
    title: 'If / Else If',
    prompt: 'What does this program print?',
    code: `public class Main {
    public static void main(String[] args) {
        int score = 85;
        if (score >= 90) {
            System.out.println("A");
        } else if (score >= 80) {
            System.out.println("B");
        } else {
            System.out.println("C");
        }
    }
}`,
    answer: 'B',
  },
  {
    id: 'daily-even',
    language: 'python',
    mode: 'code',
    level: 'Python',
    title: 'Even or Odd',
    prompt: 'Write is_even(n) that returns True if n is even and False if it is odd.',
    fnName: 'is_even',
    starter: `def is_even(n):
    # Hint: the % operator gives you the remainder
    pass
`,
    tests: [
      { args: [4], expected: true },
      { args: [7], expected: false },
      { args: [0], expected: true },
      { args: [-3], expected: false },
    ],
  },
  {
    id: 'daily-while',
    language: 'java',
    mode: 'predict',
    level: 'Java',
    title: 'While Loop Doubling',
    prompt: 'What does this program print?',
    code: `public class Main {
    public static void main(String[] args) {
        int n = 1;
        while (n < 20) {
            n = n * 2;
        }
        System.out.println(n);
    }
}`,
    answer: '32',
  },
  {
    id: 'daily-largest',
    language: 'python',
    mode: 'code',
    level: 'Python',
    title: 'Find the Largest',
    prompt: 'Write largest(numbers) that returns the biggest number in the list. Try it with a loop instead of max()!',
    fnName: 'largest',
    starter: `def largest(numbers):
    biggest = numbers[0]
    # Loop through numbers and update biggest
    return biggest
`,
    tests: [
      { args: [[3, 9, 2]], expected: 9 },
      { args: [[-4, -1, -8]], expected: -1 },
      { args: [[7]], expected: 7 },
    ],
  },
  {
    id: 'daily-concat',
    language: 'java',
    mode: 'predict',
    level: 'Java',
    title: 'Strings and Numbers',
    prompt: 'What does this program print? Put each line on its own line.',
    code: `public class Main {
    public static void main(String[] args) {
        String s = "Code";
        System.out.println(s + 1 + 2);
        System.out.println(1 + 2 + s);
    }
}`,
    answer: 'Code12\n3Code',
  },
  {
    id: 'daily-count-char',
    language: 'python',
    mode: 'code',
    level: 'Python',
    title: 'Count a Letter',
    prompt: 'Write count_letter(text, letter) that returns how many times letter appears in text.',
    fnName: 'count_letter',
    starter: `def count_letter(text, letter):
    count = 0
    # Loop through each character in text
    return count
`,
    tests: [
      { args: ['banana', 'a'], expected: 3 },
      { args: ['steel city codes', 'e'], expected: 3 },
      { args: ['python', 'z'], expected: 0 },
    ],
  },
  {
    id: 'daily-array-max',
    language: 'java',
    mode: 'predict',
    level: 'Java',
    title: 'Arrays and For-Each',
    prompt: 'What does this program print? Put each line on its own line.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] nums = {3, 7, 2, 9};
        int max = nums[0];
        for (int n : nums) {
            if (n > max) {
                max = n;
            }
        }
        System.out.println(max);
        System.out.println(nums.length);
    }
}`,
    answer: '9\n4',
  },
  {
    id: 'daily-reverse',
    language: 'python',
    mode: 'code',
    level: 'Python',
    title: 'Reverse a Word',
    prompt: 'Write reverse_word(word) that returns the word spelled backwards.',
    fnName: 'reverse_word',
    starter: `def reverse_word(word):
    # reverse_word("code") should return "edoc"
    pass
`,
    tests: [
      { args: ['code'], expected: 'edoc' },
      { args: ['Denver'], expected: 'revneD' },
      { args: [''], expected: '' },
    ],
  },
  {
    id: 'daily-booleans',
    language: 'java',
    mode: 'predict',
    level: 'Java',
    title: 'True or False?',
    prompt: 'What does this program print? Put each line on its own line.',
    code: `public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        System.out.println(a < b && b < 15);
        System.out.println(a > b || b == 10);
        System.out.println(!(a == 5));
    }
}`,
    answer: 'true\ntrue\nfalse',
  },
  {
    id: 'daily-sum-to',
    language: 'python',
    mode: 'code',
    level: 'Python',
    title: 'Add It Up',
    prompt: 'Write sum_to(n) that returns the sum of every whole number from 1 to n.',
    fnName: 'sum_to',
    starter: `def sum_to(n):
    total = 0
    # sum_to(4) should return 1 + 2 + 3 + 4 = 10
    return total
`,
    tests: [
      { args: [4], expected: 10 },
      { args: [1], expected: 1 },
      { args: [100], expected: 5050 },
    ],
  },
  {
    id: 'daily-temperature',
    language: 'python',
    mode: 'code',
    level: 'Python',
    title: 'Temperature Converter',
    prompt: 'Write f_to_c(f) that converts Fahrenheit to Celsius using (f - 32) * 5 / 9.',
    fnName: 'f_to_c',
    starter: `def f_to_c(f):
    # f_to_c(212) should return 100
    pass
`,
    tests: [
      { args: [212], expected: 100 },
      { args: [32], expected: 0 },
      { args: [-40], expected: -40 },
    ],
  },
];

const dayNumber = (date) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

export function challengeForDate(date = new Date()) {
  return dailyChallenges[dayNumber(date) % dailyChallenges.length];
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
