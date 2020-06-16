import Customer from '../../models/customer.model';

const customers = [
  {
    "cuit": "20321231000",
    "profile": {
      "firstName": "Mathew",
      "lastName": "Kennedy",
      "dni": "12345678",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "mathew.kennedy@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231001",
    "profile": {
      "firstName": "Abraham",
      "lastName": "Moran",
      "dni": "22123456",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "abraham.moran@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231002",
    "profile": {
      "firstName": "Pat",
      "lastName": "Rice",
      "dni": "23123456",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "pat.rice@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231003",
    "profile": {
      "firstName": "Kari",
      "lastName": "Patterson",
      "dni": "21123456",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "kari.patterson@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231004",
    "profile": {
      "firstName": "Gretchen",
      "lastName": "Garza",
      "dni": "24213456",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "gretchen.garza@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231005",
    "profile": {
      "firstName": "Ester",
      "lastName": "Houston",
      "dni": "24123456",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "ester.houston@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231006",
    "profile": {
      "firstName": "Antione",
      "lastName": "Elliott",
      "dni": "25123456",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "antione.elliott@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231007",
    "profile": {
      "firstName": "Santiago",
      "lastName": "Simon",
      "dni": "26213456",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "santiago.simon@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231008",
    "profile": {
      "firstName": "Giovanni",
      "lastName": "Carr",
      "dni": "27321245",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "giovanni.carr@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231009",
    "profile": {
      "firstName": "Ricardo",
      "lastName": "Andrews",
      "dni": "29123456",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "ricardo.andrews@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "203212310010",
    "profile": {
      "firstName": "Stuart",
      "lastName": "Ballard",
      "dni": "28321234",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "stuart.ballard@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231011",
    "profile": {
      "firstName": "Geraldine",
      "lastName": "Johnson",
      "dni": "28321235",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "geraldine.johnson@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231012",
    "profile": {
      "firstName": "Michael",
      "lastName": "Mattos",
      "dni": "28321236",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "michael.mattos@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231013",
    "profile": {
      "firstName": "Kelly",
      "lastName": "Stedman",
      "dni": "28321237",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "kelly.stedman@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231014",
    "profile": {
      "firstName": "Roy",
      "lastName": "Smith",
      "dni": "28321238",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "Roy.Smith@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231015",
    "profile": {
      "firstName": "Fred",
      "lastName": "Little",
      "dni": "28321239",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "Fred.Little@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231016",
    "profile": {
      "firstName": "Kaitlyn",
      "lastName": "Brock",
      "dni": "28321240",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "Kaitlyn.Brock@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231017",
    "profile": {
      "firstName": "Nathan",
      "lastName": "Jones",
      "dni": "28321241",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "Nathan.Jones@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231018",
    "profile": {
      "firstName": "Katherine",
      "lastName": "Griffin",
      "dni": "28321242",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "Katherine.Griffin@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231019",
    "profile": {
      "firstName": "Timothy",
      "lastName": "Henderson",
      "dni": "28321243",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "Timothy.Henderson@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231020",
    "profile": {
      "firstName": "Mary",
      "lastName": "Berry",
      "dni": "28321244",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "Mary.Berry@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  },{
    "cuit": "20321231021",
    "profile": {
      "firstName": "Brian",
      "lastName": "Sharp",
      "dni": "28321245",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "area": "011",
          "line": "45452323"
        }
      ],
      "email": "Brian.Sharp@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  }
]


export const createCustomers = async () => {
  console.log("Creating Customers...");
  await Promise.all(customers.map(async(customer) => {
    await Customer.create(customer);
  }))
  console.log("==========End Creating Customers...=========");
}
