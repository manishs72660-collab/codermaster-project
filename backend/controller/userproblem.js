const{ getLanguageById, submitBatch, submitToken }=require("../utils/probelmutlity");
const Problem=require("../models/problemschema");
const creatProblem=async (req,res) => {
    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;
    hiddenTestCases.push(...visibleTestCases);
    try{
        for(const {language,completeCode} of referenceSolution){ 
       const languageId = getLanguageById(language);
          
        // I am creating Batch submission
        const submissions = visibleTestCases.map((testcase)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));


        const submitResult = await submitBatch(submissions);
      //console.log(submitResult);

        const resultToken = submitResult.map((value)=> value.token);

        // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
        
       const testResult = await submitToken(resultToken);

        //console.log(testResult);

       for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).send("wrong answer");
        }
       }
      }
    const problem = await Problem.findOne({ title:title});
    if(problem){
        throw new Error("problem is already exit");
    }
    const userProblem =  await Problem.create({
        ...req.body,
        problemCreator: req.result._id
      });

      res.status(201).send("Problem Saved Successfully");
    }catch(err){
        res.send("Error "+err.message);
    }
}



module.exports=creatProblem;